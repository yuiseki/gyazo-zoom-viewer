# Gyazo-zoom-viewer

## Usage

### Docker
`docker run --rm -ti -e gyazo_access_token=xxxxx -w /root -v $PWD:/root python:3-alpine sh -c "pip install -r requirements.txt && python main.py"`

### MacOS
- `/usr/bin/ruby -e "$(curl -fsSL https://raw.githubusercontent.com/Homebrew/install/master/install)"`
- `brew install python3`
- `pip install -r requirements.txt`
- `gyazo_access_token=XXXXX && python main.py`
