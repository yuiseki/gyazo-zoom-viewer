//
// 汎用に使うライブラリ
//

///
// 角度をラジアンに変換
//
function deg2rad(deg){
    return deg * Math.PI / 180;
}

//
// 内積計算
//
function innerProduct(vec1,vec2){ // inner product
    return vec1.x * vec2.x + vec1.y * vec2.y + vec1.z * vec2.z;
}

//
// X年Y月の日数
//
function mdays(year,month){
    var days = 31;
    if(month == 4 || month == 6 || month == 9 || month == 11) days = 30;
    if(month == 2){
	days = 28;
	if(year % 4 == 0){
	    days = 29;
	    if(year % 100 == 0){
		days = 28;
		if(year % 400 == 0){
		    days = 29;
		}
	    }
	}
    }
    return days;
}

