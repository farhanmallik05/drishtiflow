import urllib.request
import os

candidates = [
    ('people_entrance.mp4', 'https://raw.githubusercontent.com/intel-iot-devkit/sample-videos/master/people-detection.mp4'),
    ('parking_vehicles.mp4', 'https://raw.githubusercontent.com/intel-iot-devkit/sample-videos/master/car-detection.mp4'),
    ('person_bicycle_car.mp4', 'https://raw.githubusercontent.com/intel-iot-devkit/sample-videos/master/person-bicycle-car-detection.mp4'),
    ('corridor_walking.mp4', 'https://raw.githubusercontent.com/intel-iot-devkit/sample-videos/master/face-demographics-walking.mp4'),
    ('worker_safety.mp4', 'https://raw.githubusercontent.com/intel-iot-devkit/sample-videos/master/worker-safety-mobility.mp4'),
    ('classroom_zone.mp4', 'https://raw.githubusercontent.com/intel-iot-devkit/sample-videos/master/classroom.mp4'),
    ('cctv_parking_lot.webm', 'https://upload.wikimedia.org/wikipedia/commons/1/14/BLK-HDPTZ12_Security_Camera_Parking_Lot_Surveillance_Video.webm'),
    ('cctv_store_entrance.webm', 'https://upload.wikimedia.org/wikipedia/commons/7/77/HD_CCTV_Camera_video_3MP_4MP_iProx_CCTV_HDCCTVCameras.net_retail_store.webm')
]

for name, url in candidates:
    try:
        req = urllib.request.Request(url, headers={'User-Agent': 'Mozilla/5.0'})
        with urllib.request.urlopen(req, timeout=6) as res:
            size = res.headers.get('content-length', '?')
            print(f"OK [{res.status}] -> {name} ({size} bytes)")
    except Exception as e:
        print(f"ERR -> {name}: {e}")

