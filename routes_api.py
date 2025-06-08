from flask import Blueprint, request, jsonify, url_for, send_file, current_app as app
import os
import numpy as np
from werkzeug.utils import secure_filename
from utils import preprocess_image_for_prediction, find_recipe, create_comparison_chart
from config import UPLOAD_FOLDER, TEMP_IMAGE_PATH, RESULT_FOLDER

api_bp = Blueprint('api', __name__)

def setup_models(models, class_names):
    global model1, model2, class_labels
    model1, model2 = models.get('model1'), models.get('model2')
    class_labels = class_names

@api_bp.route('/upload_image', methods=['POST'])
def upload_image():
    file = request.files.get('image')
    if not file:
        return jsonify({"error": "No file uploaded"}), 400

    filename = secure_filename(file.filename or "received_image.jpg")
    save_path = os.path.join(app.config['UPLOAD_FOLDER'], filename)
    file.save(save_path)

    # Bạn có thể log hoặc xử lý ảnh ở đây nếu muốn
    return jsonify({"message": "Image uploaded successfully", "path": save_path}), 200

@api_bp.route('/get_image', methods=['GET'])
def get_latest_image():
    image_path = os.path.join(app.config['UPLOAD_FOLDER'], 'received_image.jpg')
    if os.path.exists(image_path):
        return send_file(image_path, mimetype='image/jpeg')
    return jsonify({"error": "No image found"}), 404


@api_bp.route('/api/upload_and_predict', methods=['POST'])
def upload_and_predict():
    if 'file' not in request.files:
        return jsonify({'status': 'error', 'message': 'No file part'}), 400

    file = request.files['file']
    if file.filename == '':
        return jsonify({'status': 'error', 'message': 'No selected file'}), 400

    filename = secure_filename(file.filename)
    filepath = os.path.join(UPLOAD_FOLDER, filename)
    file.save(filepath)

    img_array, _ = preprocess_image_for_prediction(filepath)
    if img_array is None:
        return jsonify({'status': 'error', 'message': 'Failed to process image'}), 500

    results = {}
    best_prediction = None

    if model1 is not None:
        pred1 = model1.predict(img_array)[0]
        idx1 = np.argmax(pred1)
        results['model1'] = {
            'name': 'Model 1',
            'predicted_class': class_labels[idx1],
            'confidence': float(pred1[idx1]),
            'top5': [{
                'class': class_labels[i],
                'confidence': float(pred1[i])
            } for i in np.argsort(pred1)[-5:][::-1]]
        }

    if model2 is not None:
        pred2 = model2.predict(img_array)[0]
        idx2 = np.argmax(pred2)
        results['model2'] = {
            'name': 'Model 2',
            'predicted_class': class_labels[idx2],
            'confidence': float(pred2[idx2]),
            'top5': [{
                'class': class_labels[i],
                'confidence': float(pred2[i])
            } for i in np.argsort(pred2)[-5:][::-1]]
        }

    if 'model1' in results and 'model2' in results:
        best_prediction = (results['model1'] if results['model1']['confidence'] > results['model2']['confidence'] else results['model2'])['predicted_class']
    elif 'model1' in results:
        best_prediction = results['model1']['predicted_class']
    elif 'model2' in results:
        best_prediction = results['model2']['predicted_class']

    recipe = find_recipe(best_prediction) if best_prediction else None
    image_url = url_for('static', filename=f'uploads/{filename}')

    return jsonify({
        'status': 'success',
        'results': results,
        'best_prediction': best_prediction,
        'recipe': recipe,
        'image_url': image_url
    })