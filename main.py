#!/usr/bin/env python
# -*- coding: utf-8 -*-
import os
import json
import requests
import datetime

def getGyazoImagesData(fetch):
    print(fetch)
    if fetch:
        # Gyazo APIからデータを取得し data/ に保存する
        page = 0
        while True:
            page += 1
            api_path = "https://fix-api-images-no-metadata-default--g.gyazo.cool/api/images?access_token=%s&page=%s" % (os.environ.get('gyazo_access_token'), page)
            print(api_path)
            gyazo_res = requests.get(api_path)
            # 2xx以外だったら止める
            print(gyazo_res.status_code)
            if gyazo_res.status_code != requests.codes.ok:
                break
            # 最後尾に到達したら "[]" になるので止める
            if len(gyazo_res.text) == 2:
                break
            file_path = "data/gyazo_data_%s.json" % page
            if not os.path.isfile(file_path):
                with open(file_path, mode='x', encoding='utf-8'):
                    pass
            with open(file_path, mode='w', encoding='utf-8') as f:
                f.write(gyazo_res.text)
    
    # data/ 内のJSONをすべて結合する
    # From:
    #   {
    #     "image_id":"xxxx",
    #     "permalink_url":"https://fix-api-images-no-metadata-default--g.gyazo.cool/xxxx",
    #     "url":"https://i.gyazo.cool/f4f4dfad8180f955fe6e0bbfbd1ff49c.gif",
    #     "metadata":
    #       {
    #         "app":"Google Chrome",
    #         "title":"title of example.com",
    #         "url":"https://example.com",
    #         "desc":""
    #       },
    #     "type":"gif",
    #     "thumb_url":"https://thumb.gyazo.cool/thumb/200/xxxxx.xxxxx.xxxxx-gif.gif",
    #     "created_at":"2020-04-02T01:51:43+0000"
    #   }
    # To:
    #   {
    #     "str": "20200328193707",
    #     "id": "xxxxx",
    #     "url": "https://thumb.gyazo.com/thumb/200/xxxxx.xxxxx.xxxxx-jpg.jpg",
    #     "keywords": null,
    #     "description": "title, description",
    #     "comment": "ocr"
    #   }
    gyazo_viewer_data_all = []
    page = 0
    while True:
        page += 1
        file_path = "data/gyazo_data_%s.json" % page
        if os.path.isfile(file_path):
            with open(file_path, encoding='utf-8') as f:
                images_data = json.loads(f.read())
                gyazo_viewer_data = []
                for image in images_data:
                    id_str = image["image_id"]
                    created_at = datetime.datetime.strptime(image["created_at"], "%Y-%m-%dT%H:%M:%S%z")
                    description = ""
                    if "metadata" in image and "desc" in image["metadata"]:
                        description = image["metadata"]["desc"]
                    comment = ""
                    if "metadata" in image and "ocr" in image["metadata"]:
                        comment = image["metadata"]["ocr"]["description"]
                    data = {
                        "id": id_str,
                        "str": created_at.strftime("%Y%m%d%H%M%S"),
                        "url": image["thumb_url"],
                        "keywords": "",
                        "description": description,
                        "comment": comment
                    }
                    gyazo_viewer_data.extend([data])
                gyazo_viewer_data_all.extend(gyazo_viewer_data)
        else:
            break
    file_path = "index_files/gyazodata.js"
    with open(file_path, mode='w', encoding='utf-8') as f:
        f.write("var data = "+json.dumps(gyazo_viewer_data_all)+";")

import sys
targetMethod = None
optionalArg1 = False
if __name__ == "__main__":
    if (len(sys.argv) == 1):
        print("python main.py fetch=[true/false]")
    if (len(sys.argv) >= 2):
        optionalArg1 = (sys.argv[1] == "fetch=true")
    getGyazoImagesData(optionalArg1)