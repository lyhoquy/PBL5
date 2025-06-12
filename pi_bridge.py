import requests
from config import PI_BASE_URL

def capture_image_from_pi():
    try:
        res = requests.post(f"{PI_BASE_URL}/capture")
        return res.json()
    except Exception as e:
        return {"success": False, "error": str(e)}

def get_video_stream_url():
    return f"{PI_BASE_URL}/video_feed"
