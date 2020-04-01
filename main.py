
import os
import requests

def getGyazoImagesData():
    page = 0
    while True:
        page += 1
        api_path = "https://api.gyazo.com/api/images?access_token=%s&page=%d" % (os.environ.get('gyazo_access_token'), page)
        print(api_path)
        gyazo_res = requests.get(api_path)
        print(gyazo_res.status_code)
        if gyazo_res.status_code != requests.codes.ok:
            break
        file_path = "data/gyazo_data_%s.json" % page
        if not os.path.isfile(file_path):
            with open(file_path, mode='x'):
                pass
        with open(file_path, mode='w') as f:
            f.write(gyazo_res.text)

import sys
targetMethod = None
if __name__ == "__main__":
    if (len(sys.argv) == 1):
        print("python main.py")
    getGyazoImagesData()