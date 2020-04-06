//
//  RainbowZoomer - なんでも奇麗にズーミング表示
//  (C) 2012 Toshiyuki Masui
//
//  zoomer = new RainbowZoomer(document.getElementById('photos'),entries);
//  zoomer.update();
//

// entryの構造を書くこと!!!!

//function RainbowZoomer(div,entries){
class RainbowZoomer {
    constructor(div,entries){
	this.div = div
	this.width = Number(div.style.width.match(/[0-9]+/))
	this.height = Number(div.style.height.match(/[0-9]+/))
	// clip:rect(0px,720px,630px,0px) のようなCSS
	div.style.clip = 'rect(0px,'+div.style.width+','+div.style.height+',0px)'
	//div.style.width = '100%';
	//div.style.height = '100%';
	//div.style.width = this.width;
	//div.style.height = this.height;
	this.entries = entries
	this.indentCount = [] // インデントがnのデータがindentCount[n]個存在
	this.indentBits = []  // indentCount[n]個のデータを表現するのに必要なビット数
	this.maxindent = 0        // インデントの最大値
	this.maxDOI = 0
	this.indentLevel = []    // インデントがnのときレベルがindentLevel[n]になる
	this.countmatch = []
	this.countnomatch = []
	this.zoom = 6.0
	this.fzoom = 0.0
	this.izoom = 0
	this.offset = 0.0
	this.clickedentry = null
	
	this.down = false
	this.origzoom = 0
	this.origoffset = 0
	this.origclickedtop = 0
	this.origx = 0
	this.origy = 0
	
	this.granularity = 20.0
	this.clickZoom = true
	
	this.initData()
	
	//
	// 描画Canvasは最初に作っておき、display()で作成するのをやめる。
	//
	let canvas = document.createElement("canvas")
	canvas.style.position = 'absolute'
	canvas.style.width = this.width
	canvas.style.height = this.height
	canvas.width = this.width
	canvas.height = this.height
	canvas.style.offsetTop = 0
	canvas.style.offsetLeft = 0
	canvas.rainbowzoomer = this
	this.canvas = canvas
	this.div.appendChild(canvas)

	//
	// イベント関連
	//
	document.body.addEventListener('mouseup', this.body_mouseup, true) // RainbowZoomer外でもmouseupを取る
	document.body.addEventListener("touchend", this.body_mouseup, true)

	/*
	this.div.addEventListener('pointerdown', this.mousedown, true)
	this.div.addEventListener('pointerup', this.mouseup, true)
	this.div.addEventListener('pointermove', this.mousemove, true)
	 */

	this.div.addEventListener('click', this.click, true)
	
	this.div.addEventListener('mousedown', this.mousedown, true)
	this.div.addEventListener('mouseup', this.mouseup, true)
	this.div.addEventListener('mousemove', this.mousemove, true)
	
	this.div.addEventListener("touchstart", this.mousedown, true)
	this.div.addEventListener("touchend", this.mouseup, true)
	this.div.addEventListener("touchmove", this.mousemove, true)
	
	this.div.addEventListener('scroll', this.scroll, true)
	this.div.addEventListener('touchdown', this.scroll, true)
	if(typeof this.div.onmousewheel != 'undefined'){ // Chromeとか
	    this.div.onmousewheel = this.wheel
	}
	else { // Firefoxとか
	    this.div.addEventListener('DOMMouseScroll', this.wheel, false)
	}

	//
	// mousedown()のtargetからRainbowZoomerオブジェクトを取得するため
	//
	this.div.rainbowzoomer = this

	document.body.rainbowzoomer = this
    }
}

RainbowZoomer.prototype.defaultDiv = function(rainbowzoomer){
    let e = this.divCache
    if(e){
	e.style.left = this.left
	e.style.top = this.top + rainbowzoomer.offset
    }
    else {
	e = document.createElement("span")
	e.innerHTML = this.str
	e.style.position = "absolute"
	e.style.left = this.left
	e.style.top = this.top + rainbowzoomer.offset
	e.rainbowzoomer = rainbowzoomer
	this.divCache = e
    }
    return e
}

RainbowZoomer.prototype.defaultSizeFunction = function(entry){
    //size = {}
    //size.width = entry.width
    //size.height = entry.height
    //return size

    return { width: entry.width, height: entry.height }
}

RainbowZoomer.prototype.defaultEntry = function(str,indent,initial){ // RainbowZoomerのエントリを用意
    let entry = (initial != null ? initial : {})
    entry.str = str
    entry.indent = indent
    entry.height = 20
    entry.width = 0 // widthが0でないときは並べていく
    entry.matched = false
    entry.x = []
    entry.y = []
    entry.displayed = []
    if(!entry.div) entry.div = this.defaultDiv
    if(!entry.size) entry.size = this.defaultSizeFunction
    return entry
}

RainbowZoomer.prototype.initData = function(){
    //
    // データ初期化
    //
    let i;
    for(i=0;i<this.entries.length;i++){
	this.entries[i].index = i
    }
    this.maxindent = -1
    for(i=0;i<this.entries.length;i++){
	var ind = this.entries[i].indent
	if(! this.indentCount[ind]) this.indentCount[ind] = 0
        this.indentCount[ind]++
        if(ind > this.maxindent) this.maxindent = ind
    }
    for(i=0;i<=this.maxindent;i++){
	this.indentBits[i] = this.bits(this.indentCount[i])
        this.indentLevel[i] = (i == 0 ? 0 : this.indentLevel[i-1] + this.indentBits[i-1])
    }
    for(i=0,this.maxDOI=0;i<=this.maxindent;i++){
	this.maxDOI += this.bits(this.indentCount[i])
    }
    let indententry = []
    for(i=0;i<this.entries.length;i++){
	let entry = this.entries[i]
        entry.height = 20
        entry.width = 0 // widthが0でないときは並べていく
        entry.matched = false
        entry.x = []
        entry.y = []
        entry.displayed = []
        if(!entry.div) entry.div = this.defaultDiv
        if(!entry.size) entry.size = this.defaultSizeFunction
	entry.parent = null
	for(let indent=entry.indent-1;indent >= 0;indent--){
	    if(indententry[indent]){
		entry.parent = indententry[indent]
	        break
	    }
	}
	indententry[entry.indent] = entry
    }
}

RainbowZoomer.prototype.bits = function(n){ // nを表現するのに必要なビット数
    let i,b
    for(b=0,i=1;i<n;b++) i *= 2
    if(b == 0) b = 1
    return b
}

RainbowZoomer.prototype.fixEvent = function(e){
    //    if(e.changedTouches){
    //	e.pageX = e.changedTouches[0].pageX;
    //	e.pageY = e.changedTouches[0].pageY;
    //    }

    //document.getElementById('value').innerHTML = e.type;

    let ee = {}
    ee.pageX = e.pageX
    ee.pageY = e.pageY
    
    let touches = false;
    // http://www.the-xavi.com/articles/trouble-with-touch-events-jquery
    if(e.touches && e.touches.length > 0) {
        touches = e.touches;
    }
    else if(e.changedTouches && e.changedTouches.length > 0){
        touches = e.changedTouches;
    }

    if(touches){ // マルチタッチ機器
	//e.pageX = touches[0].pageX;
	//e.pageY = touches[0].pageY;
	ee.pageX = touches[0].pageX;
	ee.pageY = touches[0].pageY;
    }

    return ee
}

/*
RainbowZoomer.prototype.donothing = function(e){
    if(e.type == 'mousedown'){
	e.target.rainbowzoomer.down = true
    }
    if(e.type == 'mouseup'){
	e.target.rainbowzoomer.down = false
    }
    e.preventDefault();
    return true;
}
*/
    
RainbowZoomer.prototype.mousedown = function(e){
    console.log(`mousedown - type=${e.type}`)
    
    e.preventDefault()
    let rainbowzoomer = e.target.rainbowzoomer

    //rainbowzoomer.canvas.requestPointerLock();

    document.querySelector('input').blur();
    
    // リンクをクリックしたときはジャンプするようにする
    // !!! 美しくないので修正するべき
    if(e.target.href != undefined){
	location.href = e.target.href
	return;
    }

    rainbowzoomer.mousedowntime = new Date()

    let offsetTop = rainbowzoomer.div.offsetTop
    let offsetLeft = rainbowzoomer.div.offsetLeft

    let ee = rainbowzoomer.fixEvent(e)
    rainbowzoomer.mousedownx = ee.pageX
    rainbowzoomer.mousedowny = ee.pageY

    rainbowzoomer.clickedentry = null
    for(let i=0;i<rainbowzoomer.entries.length;i++){
	let entry = rainbowzoomer.entries[i]
	if(entry.displayed[0] &&
	   ee.pageY-offsetTop >= entry.top + rainbowzoomer.offset &&
	   ee.pageX-offsetLeft >= entry.left &&
	   (entry.width == 0 || ee.pageX-offsetLeft < entry.left+entry.width)){
	    rainbowzoomer.clickedentry = entry
    	    rainbowzoomer.origclickedtop = rainbowzoomer.clickedentry.top
	}
    }
    if(rainbowzoomer.clickedentry){
	/*
	rainbowzoomer.clickedentry.div(this).style.background = "#ff0"

	let centery = rainbowzoomer.clickedentry.div(this).style.top
	centery = Number(centery.replace(/px/,''))
	centery += 50
	document.getElementById('centerline').style.top = centery
	 */

	rainbowzoomer.calcdoi()
	rainbowzoomer.clickedentry.doi = -1000 // クリックしたエントリは消えないようにする

	// クリックしたエントリと同じレベルのエントリと親エントリを表示する
	// ...という単純なやり方はマズい。どういう工夫をすべきか?
	if(rainbowzoomer.clickZoom){
	    var indent = rainbowzoomer.clickedentry.indent
	    for(var i = rainbowzoomer.clickedentry.index;i>=0 && rainbowzoomer.entries[i].indent == indent; i--){
		rainbowzoomer.entries[i].doi = -100
	    }
	    for(var i = rainbowzoomer.clickedentry.index;i<rainbowzoomer.entries.length && rainbowzoomer.entries[i].indent == indent; i++){
		rainbowzoomer.entries[i].doi = -100
	    }
	    
	    for(var parent = rainbowzoomer.clickedentry.parent;parent;parent = parent.parent){
		parent.doi = -100
	    }
	}
    }

    rainbowzoomer.down = true
    rainbowzoomer.origzoom = rainbowzoomer.zoom
    rainbowzoomer.origoffset = rainbowzoomer.offset
    rainbowzoomer.origx = ee.pageX-offsetLeft
    rainbowzoomer.origy = ee.pageY-offsetTop
}

RainbowZoomer.prototype.mouseup = function(e){
    let rainbowzoomer = e.target.rainbowzoomer

    //document.exitPointerLock();
    rainbowzoomer.clickedentry.div(this).style.background = ""

    let offsetTop = rainbowzoomer.div.offsetTop
    let offsetLeft = rainbowzoomer.div.offsetLeft

    let ee = rainbowzoomer.fixEvent(e)
    e.preventDefault()
    rainbowzoomer.down = false

    if(rainbowzoomer.clickedentry){
	if(rainbowzoomer.clickedentry.id){
	    if(Math.abs(ee.pageX - rainbowzoomer.mousedownx) < 10 &&
	       Math.abs(ee.pageY - rainbowzoomer.mousedowny) < 10){
		if(expanded){
		    window.open("https://Gyazo.com/" + rainbowzoomer.clickedentry.id)
		}
		else {
		    let s = rainbowzoomer.clickedentry.str
		    for(let i=0;i<entries.length;i++){
			if(entries[i].str.indexOf(s) == 0){
			    entries[i].matched = true
			}
		    }
		    expanded = true
		    rainbowzoomer.update()
		}
	    }
	}
	else {
	    if(Math.abs(ee.pageX - rainbowzoomer.mousedownx) < 10 &&
	       Math.abs(ee.pageY - rainbowzoomer.mousedowny) < 10){
		let innerhtml = rainbowzoomer.clickedentry.div(this).innerHTML
		let s = innerhtml.match(/^(.*)\s/)[1]
		let level1 = innerhtml.match(/^(\d+) /)
		let level2 = innerhtml.match(/^(\d+\/\d+) /)
		let level3 = innerhtml.match(/^(\d+\/\d+\/\d+) /)
		for(let i=0;i<entries.length;i++){
		    if(entries[i].str.indexOf(s) == 0){
			if(level1){
			    if(entries[i].str.match(/^(\d+\/\d+) /)){
				entries[i].matched = true
			    }
			}
			else if(level2){
			    if(entries[i].str.match(/^(\d+\/\d+\/\d+) /)){
				entries[i].matched = true
			    }
			}
			else if(level3){
			    expanded = true
			    entries[i].matched = true
			}
		    }
		}
		rainbowzoomer.update()
	    }
	}
    }

    if(rainbowzoomer.fzoom > 0.5){
	rainbowzoomer.zoom = Math.floor(rainbowzoomer.zoom)+1
    }
    else {
	rainbowzoomer.zoom = Math.floor(rainbowzoomer.zoom)
    }
    rainbowzoomer.calcpos()
    rainbowzoomer.offset = rainbowzoomer.origoffset + (ee.pageY-offsetTop - rainbowzoomer.origy) - (rainbowzoomer.clickedentry.top - rainbowzoomer.origclickedtop)
    rainbowzoomer.display()
}

RainbowZoomer.prototype.body_mouseup = function(e){
    let rainbowzoomer = e.target.rainbowzoomer

    if(rainbowzoomer == undefined){
	return
    }

    //document.exitPointerLock();
    //rainbowzoomer.clickedentry.div(this).style.background = ""
    
    let offsetTop = rainbowzoomer.div.offsetTop
    let offsetLeft = rainbowzoomer.div.offsetLeft

    let ee = rainbowzoomer.fixEvent(e)
    e.preventDefault()
    rainbowzoomer.down = false

    if(rainbowzoomer.fzoom > 0.5){
	rainbowzoomer.zoom = Math.floor(rainbowzoomer.zoom)+1
    }
    else {
	rainbowzoomer.zoom = Math.floor(rainbowzoomer.zoom)
    }
    rainbowzoomer.calcpos()
    rainbowzoomer.offset = rainbowzoomer.origoffset + (ee.pageY-offsetTop - rainbowzoomer.origy) - (rainbowzoomer.clickedentry.top - rainbowzoomer.origclickedtop)
    rainbowzoomer.display()
}

RainbowZoomer.prototype.mousemove = function(e){
    //console.log("mousemove")
    console.log(`mousemove... type = ${e.type}`)
    
    let rainbowzoomer = e.target.rainbowzoomer

    //rainbowzoomer.canvas.requestPointerLock();
    
    let ee = rainbowzoomer.fixEvent(e);
    
    e.preventDefault()
    if(rainbowzoomer.down){
	let offsetTop = rainbowzoomer.div.offsetTop
	let offsetLeft = rainbowzoomer.div.offsetLeft

	// rainbowzoomer.fixEvent(e);

	// この計算にちょっと余裕(遊び)をもたせたい
	//rainbowzoomer.zoom = rainbowzoomer.origzoom + (ee.pageX-offsetLeft - rainbowzoomer.origx) / rainbowzoomer.granularity
	let delta = ((ee.pageX-offsetLeft) - rainbowzoomer.origx - 50) / rainbowzoomer.granularity
	if(ee.pageX-offsetLeft > rainbowzoomer.origx){
	    if(delta < 0) delta = 0
	}
	else {
	    delta = -((rainbowzoomer.origx - (ee.pageX-offsetLeft) - 50) / rainbowzoomer.granularity)
	    if(delta > 0) delta = 0
	}
	rainbowzoomer.zoom = rainbowzoomer.origzoom + delta

	
	if(rainbowzoomer.zoom < 3.0) rainbowzoomer.zoom = 3.0
	if(rainbowzoomer.zoom > this.maxDOI) rainbowzoomer.zoom = this.maxDOI
	rainbowzoomer.calcpos()
	rainbowzoomer.offset = rainbowzoomer.origoffset + (ee.pageY-offsetTop - rainbowzoomer.origy) - (rainbowzoomer.clickedentry.top - rainbowzoomer.origclickedtop)
	rainbowzoomer.display()
    }
}

RainbowZoomer.prototype.click = function(e){
    let rainbowzoomer = e.target.rainbowzoomer

    rainbowzoomer.down = false

    if(rainbowzoomer.clickedentry){
	if(rainbowzoomer.clickedentry.id){
	    window.open("https://Gyazo.com/" + rainbowzoomer.clickedentry.id)
	}
    }
}
	
// http://www.adomas.org/javascript-mouse-wheel/
RainbowZoomer.prototype.wheel = function(e){
    let rainbowzoomer = e.target.rainbowzoomer;
    rainbowzoomer.fixEvent(e)
    e.preventDefault()
    if(rainbowzoomer){
	if(e.detail){ // Mozilla
	    rainbowzoomer.offset += e.detail // +/- でスクロールの向きがかわる
	}
	else {
	    rainbowzoomer.offset += e.wheelDelta / 3
	}
	//if(rainbowzoomer.offset < -10) rainbowzoomer.offset = -10
	if(rainbowzoomer.offset > rainbowzoomer.maxPosY) rainbowzoomer.offset = rainbowzoomer.maxPosY
	rainbowzoomer.display()
    }
}

RainbowZoomer.prototype._calcEntryPositions = function(ind){
    let posy = 0.0
    let posx = 0.0
    //var count = 0
    let maxheight = 0
    for(let i=0;i<this.entries.length;i++){
	let entry = this.entries[i]
	if(entry.displayed[ind]){
	    let size = entry.size(entry);
	    if(size.width == 0){ // 1エントリだけ表示
		if(posx != 0.0){
		    posy += maxheight
		    posx = 0.0
		}
		entry.y[ind] = posy
		entry.x[ind] = 10.0 + entry.indent * 20.0
		posy += entry.height
		maxheight = 0
	    }
	    else {
		if(entry.indent * 20.0 + posx + size.width > this.width){// あふれ
		    posy += maxheight
		    posx = 0.0
		    maxheight = 0
		}
		entry.y[ind] = posy
		entry.x[ind] = entry.indent * 20.0 + posx
		posx += size.width
		if(size.height > maxheight) maxheight = size.height
	    }
	}
    }
    this.maxPosY = posy
}

RainbowZoomer.prototype.calcpos = function(){
    this.izoom = Math.floor(this.zoom)
    this.fzoom = this.zoom - this.izoom
    // izoomのレベルとizoom+1のレベルで表示すべき行を計算
    // (izoom+1の方が表示が多いようにする)
    let count = 0
    for(let i=0;i<this.entries.length;i++){
	let entry = this.entries[i]
        entry.displayed[0] = (entry.doi < this.izoom)
        entry.displayed[1] = (entry.doi < this.izoom+1)
	if(entry.displayed[0]){
	    entry.displayCount = count++
	}
    }
    // izoom, izoom+1の表示位置を計算する
    this._calcEntryPositions(0)
    this._calcEntryPositions(1)

    // 間を補間
    for(let i=0;i<this.entries.length;i++){
	let entry = this.entries[i]
	if(entry.displayed[0]){
	    entry.top = Math.floor(entry.y[0] * (1.0-this.fzoom) + entry.y[1] * this.fzoom)
	    entry.left = entry.x[0] * (1.0-this.fzoom) + entry.x[1] * this.fzoom
	    entry.width = 0
	}
    }
}

//
// エントリの重要度(DOI = Degree Of Interest)を計算する。
// 重要なほど値が小さい。
//
// DOIの計算
//  * インデントが大きいものはDOIも大きくする
//  * 同じインデントのエントリが並んでいるときは以下のようにDOIを計算する
//     行番号 エントリ DOI 行番号の2進数表現 LSBに並ぶ0の数
//     1      a        3   0001              0
//     2      b        2   0010              1
//     3      c        3   0011              0
//     4      d        1   0100              2
//     5      e        3   0101              0
//     6      f        2   0110              1
//     7      g        3   0111              0
//     8      h        0   1000              3
//     9      i        3   1001              0
//     ...
//  ズーミングレベルが0のときは h だけ表示される
//  ズーミングレベルが1のときは d, h が表示される
//  ズーミングレベルが2のときは b, d, f, h が表示される
//  このようにすることによりじわじわ表示量を制御することができる
//  DOI値は行番号の2進数表現の0/1パタンから計算できる
//  DOI値 = 3 - LSBの0の数
//
RainbowZoomer.prototype.calcdoi = function(){
    let i,j,k;
    let b;
    let mask;
    let indent;
    let entry;

    for(i=0;i<=this.maxindent;i++){
        this.countmatch[i] = 1;
	this.countnomatch[i] = 1;
    }

    for(i=0;i<this.entries.length;i++){
	entry = this.entries[i];
        indent = entry.indent;
        b = this.indentBits[indent];
        if(entry.matched){
	    for(mask=1,j=0;j<b;j++,mask<<=1){
		if(mask & this.countmatch[indent]) break;
	    }
	    entry.doi = this.indentLevel[indent] + b - j - 1 - this.maxDOI;
	    this.countmatch[indent]++;
	}
	else {
	    for(mask=1,j=0;j<b;j++,mask<<=1){
		if(mask & this.countnomatch[indent]) break;
	    }
	    entry.doi = this.indentLevel[indent] + b - j;
	    this.countnomatch[indent]++;
	}
    }
}

RainbowZoomer.prototype.rainbowColor_orig = function(s){ // 虹色ぽいものを生成
    let val = 0;
    for(let i=0;i<s.length;i++){
	val = (val * 1234567 + s.charCodeAt(s.length-i-1)) % 9876;
    }
    let r,g,b;
    r = val % 56 + 200;
    g = val % 50 + 200;
    b = val % 48 + 200;
    return 'rgb('+r+','+g+','+b+')';
}

RainbowZoomer.prototype.rainbowColor = function(entry){
    //if(entry.indent == 0) return 'rgb(250,250,200)';
    //if(entry.indent == 1) return 'rgb(250,210,250)';
    //if(entry.indent == 2) return 'rgb(200,240,240)';
    //if(entry.indent == 3) return 'rgb(200,200,200)';
    //if(entry.indent == 4) return 'rgb(170,170,170)';
    if(entry.indent == 0) return 'rgb(240,240,240)';
    if(entry.indent == 1) return 'rgb(220,220,220)';
    if(entry.indent == 2) return 'rgb(200,200,200)';
    if(entry.indent == 3) return 'rgb(170,170,170)';
    if(entry.indent == 4) return 'rgb(170,170,170)';
    return 'rgb(10,10,10)';
};

RainbowZoomer.prototype.display = function(){
    while(this.div.childNodes.length > 0){
	this.div.removeChild(this.div.childNodes.item(0));
    }

    this.div.appendChild(this.canvas);

    if(this.down){
	if(this.clickedentry){
	    let centery = this.clickedentry.div(this).style.top
	    centery = Number(centery.replace(/px/,''))
	    centery += 60
	    document.getElementById('centerline').style.display = 'block'
	    document.getElementById('centerline').style.top = centery
	}
    }
    else {
	document.getElementById('centerline').style.display = 'none'
    }

    let ctx = this.canvas.getContext('2d');
    ctx.setTransform(1.0,0.0,0.0,1.0,0.0,0.0);

    // バックグラウンド消去
    ctx.fillStyle = 'rgb(240,240,240)';
    ctx.fillRect(0,0,this.width,this.height);

    let indentLength = []; // 同じインデントレベルがいくつ並んでいるか (縦書き対応)
    let parentEntries = [];
    let oldParentEntries = [];
    let oldindex = 0;
    for(let i=0;i<this.maxindent;i++){
	indentLength[i] = 0;
    }
    for(let i=0;i<this.entries.length;i++){
	let entry = this.entries[i];
	if(entry.displayed[0]){
	    if(entry.top + this.offset > -200 && entry.top + this.offset < this.height){ // !!! あふれたらfor()から抜けるべき
		ctx.setTransform(1.0,0.0,0.0,1.0,0.0,0.0);
		var parents = [];
		for(var parent = entry.parent;parent;parent = parent.parent){
		    parents.push(parent);
		}
		for(var j=parents.length-1;j>=0;j--){
		    for(var k=parents[j].indent;k<this.maxindent;k++){
			parentEntries[k] = parents[j];
		    }
		}
		for(var k=entry.indent;k<this.maxindent;k++){
		    parentEntries[k] = entry;
		}
		for(var j=parents.length-1;j>=0;j--){
		    var parent = parents[j];
		    //ctx.fillStyle = this.rainbowColor(parent.str); // !!! colorは初期化時に計算しておくべき
		    ctx.fillStyle = this.rainbowColor(parent);
		    ctx.fillRect(parent.left-5,entry.top+this.offset,this.width-(parent.left-5),300);
		    
		    if(oldParentEntries[parent.indent] != parentEntries[parent.indent]){
			ctx.strokeStyle = 'rgb(255,255,255)';
			ctx.beginPath();
			ctx.lineWidth = 1;
			ctx.moveTo(parent.left-5,entry.top+this.offset+2);
			ctx.lineTo(this.width,entry.top+this.offset+2);
			ctx.stroke();
		    }
		    ctx.beginPath();
		    ctx.strokeStyle = 'rgb(255,255,255)';
		    ctx.lineWidth = 1;
		    ctx.moveTo(parent.left-5,entry.top+this.offset);
		    ctx.lineTo(parent.left-5,entry.top+this.offset+2+300);
		    ctx.stroke();
		}
		for(var j=0;j<=this.maxindent;j++){
		    if(oldParentEntries[j] == parentEntries[j]){
			indentLength[j] += 1;
		    }
		    else {
			indentLength[j] = 0;
		    }
		    oldParentEntries[j] = parentEntries[j];
		}
		
		//var col = this.rainbowColor(entry.str); // !!!
		var col = this.rainbowColor(entry); // !!!
		ctx.fillStyle = col;
		ctx.fillRect(entry.left-5,entry.top+this.offset,800,300);
		
		ctx.strokeStyle = 'rgb(255,255,255)';
		if(entry.index != oldindex+1){
		    ctx.strokeStyle = 'rgb(100,100,100)';
		}
		oldindex = entry.index;
		ctx.beginPath();
		ctx.lineWidth = 1;
		ctx.moveTo(entry.left-5,entry.top+this.offset+2);
		ctx.lineTo(this.width,entry.top+this.offset+2);
		ctx.stroke();
		
		ctx.strokeStyle = 'rgb(255,255,255)';
		ctx.beginPath();
		ctx.lineWidth = 1;
		ctx.moveTo(entry.left-5,entry.top+this.offset+3);
		ctx.lineTo(entry.left-5,entry.top+this.offset+3+300);
		ctx.stroke();
		
		// 親の縦書き表示
		ctx.rotate(-90 * Math.PI / 180);
		ctx.font = "14px Helvetica";
		ctx.fillStyle = "#777";
		for(var indent=0;indent<=this.maxindent;indent++){
		    if(indentLength[indent] >= 6 && entry.displayCount % 10 == 6){
			var x,y;
			y = indent * 20 + 20;
			x = -(entry.top+this.offset);
			// indentLength[indent] = 0;
			ctx.fillText(oldParentEntries[indent].str,x,y);
		    }
		}
		this.div.appendChild(entry.div(this));
	    }
	}
    }
}

RainbowZoomer.prototype.update = function(zoom,offset){
    this.zoom = (zoom ? zoom : 6.0)
    this.calcdoi()
    this.calcpos()
    this.offset = (offset ? offset : 0.0)
    this.display()
}

RainbowZoomer.prototype.setGranularity = function(val){
    this.granularity = val
}
RainbowZoomer.prototype.setClickZoom = function(val){
    this.clickZoom = val
}

