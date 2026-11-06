import urllib.request
import os
import sys

dest_dir = os.path.join(os.path.dirname(__file__), 'public', 'videos')
os.makedirs(dest_dir, exist_ok=True)

downloads = [
    ('cam_entrance.mp4', 'https://raw.githubusercontent.com/intel-iot-devkit/sample-videos/master/people-detection.mp4'),
    ('cam_parking.mp4', 'https://raw.githubusercontent.com/intel-iot-devkit/sample-videos/master/car-detection.mp4'),
    ('cam_corridor.mp4', 'https://raw.githubusercontent.com/intel-iot-devkit/sample-videos/master/face-demographics-walking.mp4'),
    ('cam_loading_dock.mp4', 'https://raw.githubusercontent.com/intel-iot-devkit/sample-videos/master/person-bicycle-car-detection.mp4'),
    ('cam_restricted.mp4', 'https://raw.githubusercontent.com/intel-iot-devkit/sample-videos/master/classroom.mp4'),
]

for filename, url in downloads:
    target_path = os.path.join(dest_dir, filename)
    if os.path.exists(target_path) and os.path.getsize(target_path) > 100000:
        print(f"Already exists: {filename} ({os.path.getsize(target_path)} bytes)")
        continue

    print(f"Downloading {filename} from {url}...")
    try:
        req = urllib.request.Request(url, headers={'User-Agent': 'Mozilla/5.0'})
        with urllib.request.urlopen(req, timeout=30) as res, open(target_path, 'wb') as f:
            f.write(res.read())
        print(f"Downloaded {filename}: {os.path.getsize(target_path)} bytes")
    except Exception as e:
        print(f"Failed {filename}: {e}")

