import numpy as np
import traceback
import json
import os
import unicodedata
import re
import matplotlib
matplotlib.use('Agg')
import matplotlib.pyplot as plt
from tensorflow.keras.preprocessing import image
from config import IMG_SIZE, RECIPES_PATH
from PIL import Image
import io


def preprocess_image_for_prediction(image_path):
    try:
        img = image.load_img(image_path, target_size=(IMG_SIZE, IMG_SIZE))
        img_array = image.img_to_array(img) / 255.0
        img_array = np.expand_dims(img_array, axis=0)
        return img_array, img
    except Exception as e:
        print(f"[ERROR] Preprocess failed: {e}")
        return None, None

def create_comparison_chart(pred1, pred2, class_names, chart_path):
    try:
        top5_1 = np.argsort(pred1)[-5:][::-1]
        top5_2 = np.argsort(pred2)[-5:][::-1]

        fig, (ax1, ax2) = plt.subplots(1, 2, figsize=(14, 6))
        ax1.barh([class_names[i] for i in top5_1], [pred1[i] for i in top5_1], color='cornflowerblue')
        ax1.set_title('Model 1')
        ax1.set_xlim(0, 1)

        ax2.barh([class_names[i] for i in top5_2], [pred2[i] for i in top5_2], color='lightcoral')
        ax2.set_title('Model 2 (DenseNet169)')
        ax2.set_xlim(0, 1)

        plt.tight_layout()
        plt.savefig(chart_path)
        plt.close()
        return True
    except Exception as e:
        print(f"[ERROR] Chart creation failed: {e}\n{traceback.format_exc()}")
        return False

def normalize_key(s):
    s = unicodedata.normalize('NFKD', s).encode('ASCII', 'ignore').decode('ASCII')
    s = re.sub(r'[^\w\s]', '', s).lower().strip()
    return s.replace(' ', '_')

def find_recipe(dish_name, recipes_path='RECIPES_PATH'):
    try:
        if not os.path.exists(recipes_path):
            return None

        with open(recipes_path, 'r', encoding='utf-8') as f:
            recipes = json.load(f)

        normalized = normalize_key(dish_name)
        if normalized in recipes:
            return recipes[normalized]

        for key in recipes:
            if normalized in key or key in normalized:
                return recipes[key]

        return None
    except Exception as e:
        print(f"[ERROR] Recipe lookup failed: {e}")
        return None

def optimize_image(image_file):
    """Optimize uploaded images before processing"""
    img = Image.open(image_file)
    
    # Convert to RGB if needed
    if img.mode in ('RGBA', 'P'):
        img = img.convert('RGB')
    
    # Resize if too large
    max_size = 800
    if max(img.size) > max_size:
        img.thumbnail((max_size, max_size), Image.LANCZOS)
    
    # Optimize
    buffer = io.BytesIO()
    img.save(buffer, format='JPEG', optimize=True, quality=85)
    return buffer.getvalue()