import urllib.request

fire_candidates = [
    'https://raw.githubusercontent.com/gengyanlei/fire-detect-yolov4/master/data/video/test1.mp4',
    'https://raw.githubusercontent.com/OlafenwaMoses/FireNET/master/fire_sample.mp4',
    'https://raw.githubusercontent.com/roboflow/supervision/develop/assets/supervision-video.mp4',
    'https://raw.githubusercontent.com/ultralytics/assets/releases/download/v0.0.0/traffic.mp4',
    'https://raw.githubusercontent.com/ultralytics/assets/releases/download/v0.0.0/bus.jpg',
]

for url in fire_candidates:
    try:
        req = urllib.request.Request(url, headers={'User-Agent': 'Mozilla/5.0'})
        with urllib.request.urlopen(req, timeout=6) as res:
            name = url.split('/')[-1]
            size = res.headers.get('content-length', '?')
            print(f"OK [{res.status}] -> {name} ({size} bytes)")
    except Exception as e:
        print(f"ERR -> {url}: {e}")

