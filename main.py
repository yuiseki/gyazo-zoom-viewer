
import os
import json
import requests

def getGyazoImagesData(fetch):
    if fetch:
        # Gyazo APIからデータを取得し data/ に保存する
        page = 0
        while True:
            page += 1
            api_path = "https://api.gyazo.com/api/images?access_token=%s&page=%s" % (os.environ.get('gyazo_access_token'), page)
            print(api_path)
            gyazo_res = requests.get(api_path)
            print(gyazo_res.status_code)
            # 2xx以外だったら止める
            if gyazo_res.status_code != requests.codes.ok:
                break
            # 最後尾に到達したら "[]" になるので止める
            if len(gyazo_res.text) == 2:
                break
            file_path = "data/gyazo_data_%s.json" % page
            if not os.path.isfile(file_path):
                with open(file_path, mode='x'):
                    pass
            with open(file_path, mode='w') as f:
                f.write(gyazo_res.text)
    
    # data/ 内のJSONをすべて結合する
    gyazo_data_all = []
    page = 0
    while True:
        page += 1
        file_path = "data/gyazo_data_%s.json" % page
        if os.path.isfile(file_path):
            with open(file_path) as f:
                gyazo_data = json.loads(f.read())
                gyazo_data_all.extend(gyazo_data)
        else:
            break
    file_path = "data/gyazo_data_all.json"
    with open(file_path, mode='w') as f:
        f.write(json.dumps(gyazo_data_all))

import sys
targetMethod = None
optionalArg1 = False
if __name__ == "__main__":
    if (len(sys.argv) == 1):
        print("python main.py fetch=[true/false]")
    if (len(sys.argv) > 2):
        optionalArg1 = (sys.argv[1] == "fetch=true")
    getGyazoImagesData(optionalArg1)