from flask import Blueprint, render_template, url_for
from config import TEMP_IMAGE_PATH
import os
from utils import preprocess_image_for_prediction, find_recipe

web_bp = Blueprint('web', __name__)

def setup_web_context(models, class_names, destinations):
    global model1, model2, class_labels, dests
    model1, model2 = models.get('model1'), models.get('model2')
    class_labels = class_names
    dests = destinations

@web_bp.route('/')
def index():
    return render_template('latest.html', active_tab='home')

@web_bp.route('/predict_pi_image')
def predict_pi_image():
    if not os.path.exists(TEMP_IMAGE_PATH):
        return render_template('test.html', active_tab='predict', error='No Pi image')

    img_array, _ = preprocess_image_for_prediction(TEMP_IMAGE_PATH)
    if img_array is None:
        return render_template('test.html', active_tab='predict', error='Cannot process image')

    results = {}
    best_prediction = None

    if model1 is not None:
        pred1 = model1.predict(img_array)[0]
        idx1 = pred1.argmax()
        results['model1'] = {
            'name': 'Model 1',
            'predicted_class': class_labels[idx1],
            'confidence': float(pred1[idx1]),
            'top5': [{
                'class': class_labels[i],
                'confidence': float(pred1[i])
            } for i in pred1.argsort()[-5:][::-1]]
        }

    if model2 is not None:
        pred2 = model2.predict(img_array)[0]
        idx2 = pred2.argmax()
        results['model2'] = {
            'name': 'Model 2',
            'predicted_class': class_labels[idx2],
            'confidence': float(pred2[idx2]),
            'top5': [{
                'class': class_labels[i],
                'confidence': float(pred2[i])
            } for i in pred2.argsort()[-5:][::-1]]
        }

    if 'model1' in results and 'model2' in results:
        best_model = 'model1' if results['model1']['confidence'] > results['model2']['confidence'] else 'model2'
        best_prediction = results[best_model]['predicted_class']
    elif 'model1' in results:
        best_model = 'model1'
        best_prediction = results['model1']['predicted_class']
    elif 'model2' in results:
        best_model = 'model2'
        best_prediction = results['model2']['predicted_class']

    recipe = find_recipe(best_prediction)
    from utils import normalize_key
    normalized = normalize_key(best_prediction) if best_prediction else ''

    destination_info = dests.get(normalized, {})

    return render_template(
        'test.html',
        active_tab='results',
        image_path=url_for('static', filename='uploads/received_image.jpg'),
        results=results,
        best_prediction=best_prediction,
        best_confidence=results[best_model]['confidence'] if best_model else 0,
        best_model=best_model,
        recipe=recipe,
        destination_info=destination_info,
        is_pi_image=True
    )
