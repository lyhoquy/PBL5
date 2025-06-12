import os
import socket

BASE_DIR = os.path.dirname(os.path.abspath(__file__))

UPLOAD_FOLDER = os.path.join(BASE_DIR, 'static/uploads')
RESULT_FOLDER = os.path.join(BASE_DIR, 'static/results')
TEMP_IMAGE_PATH = os.path.join(UPLOAD_FOLDER, 'received_image.jpg')

MODEL_PATHS = {
    'model1': os.path.join(BASE_DIR, 'models/vietnamese_food_model.h5'),
    'model2': os.path.join(BASE_DIR, 'models/DenseNet169.h5')
}

CLASS_NAMES_PATH = os.path.join(BASE_DIR, 'static/assets/data/class_names.txt')
RECIPES_PATH = os.path.join(BASE_DIR, 'static/assets/data/recipes.json')
DESTINATIONS_PATH = os.path.join(BASE_DIR, 'static/assets/data/destinations.json')

IMG_SIZE = 224

def get_local_ip():
    try:
        s = socket.socket(socket.AF_INET, socket.SOCK_DGRAM)
        s.connect(("8.8.8.8", 80))
        ip = s.getsockname()[0]
        s.close()
        return ip
    except:
        return '127.0.0.1'  # fallback an toàn

HOST = os.environ.get('FLASK_HOST', get_local_ip())
PORT = int(os.environ.get('FLASK_PORT', 5000))

WEB_SERVER_URL = "http://192.168.1.104:5000"
PI_HOST = '192.168.1.109'
PI_PORT = 8080
PI_BASE_URL = f"http://{PI_HOST}:{PI_PORT}"