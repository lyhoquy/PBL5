from flask import Flask, jsonify, Response, request
import time, base64, os
from picamera2 import Picamera2
import threading
import cv2
from flask_cors import CORS

# Flask setup
app = Flask(__name__)
CORS(app)

# Camera setup
camera = None
camera_lock = threading.Lock()
TEMP_IMAGE_PATH = '/tmp/captured_image.jpg'
IMAGE_PATH = '/tmp/pred_image.jpg'
SERVER_URL = "http://192.168.1.104:5000/api/upload_and_predict"

def init_camera():
    """Initialize Pi Camera once"""
    global camera
    if camera is None:
        camera = Picamera2()
        camera.configure(camera.create_still_configuration(main={"size": (1024, 768)}))
        camera.start()
        time.sleep(2)

def capture_image():
    """Capture still image to file"""
    cam = Picamera2()
    cam.configure(cam.create_still_configuration(main={"size": (1024, 768)}))
    cam.start()
    time.sleep(2)
    cam.capture_file(IMAGE_PATH)
    cam.close()

def send_image_for_prediction():
    """Send image to server for analysis"""
    print("Sending image to server:", IMAGE_PATH)
    try:
        with open(IMAGE_PATH, "rb") as f:
            files = {'file': ("image.jpg", f, "image/jpeg")}
            res = requests.post(SERVER_URL, files=files)
            print("Response:", res.status_code, res.text)
    except Exception as e:
        print("Error sending image:", str(e))

# Flask routes
@app.route('/')
def home():
    return 'Pi Camera Server Running'

@app.route('/pi_status')
def pi_status():
    return jsonify({"status": "connected", "camera_ready": True})

@app.route('/video_feed')
def video_feed():
    def generate():
        init_camera()
        while True:
            with camera_lock:
                frame = camera.capture_array()
            _, buffer = cv2.imencode('.jpg', frame)
            jpg_bytes = buffer.tobytes()
            yield (b'--frame\r\nContent-Type: image/jpeg\r\n\r\n' + jpg_bytes + b'\r\n')
            time.sleep(0.1)
    return Response(generate(), mimetype='multipart/x-mixed-replace; boundary=frame')

@app.route('/capture', methods=['POST'])
def capture():
    try:
        init_camera()
        with camera_lock:
            camera.capture_file(TEMP_IMAGE_PATH)
        with open(TEMP_IMAGE_PATH, 'rb') as f:
            img_base64 = base64.b64encode(f.read()).decode('utf-8')
        return jsonify({"success": True, "image": f"data:image/jpeg;base64,{img_base64}"})
    except Exception as e:
        return jsonify({"success": False, "error": str(e)})

if __name__ == '__main__':
    app.run(host='0.0.0.0', port=8080, debug=False, threaded=True)
