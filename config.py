import os

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

HOST = '10.10.58.201'
PORT = 5000
