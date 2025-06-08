from flask import Flask
from config import HOST, PORT, UPLOAD_FOLDER, RESULT_FOLDER, CLASS_NAMES_PATH, RECIPES_PATH, MODEL_PATHS, DESTINATIONS_PATH
import os, json, logging
from tensorflow.keras.models import load_model


# Flask app
app = Flask(__name__)
app.config['UPLOAD_FOLDER'] = UPLOAD_FOLDER
app.config['RESULT_FOLDER'] = RESULT_FOLDER

# Logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# Load class names, models, and recipes
model1, model2, class_names, destinations = None, None, [], {}

try:
    with open(CLASS_NAMES_PATH, 'r') as f:
        class_names = json.load(f)
    logger.info(f"Loaded {len(class_names)} class names")

    with open(RECIPES_PATH, 'r', encoding='utf-8') as f:
        recipes = json.load(f)
    logger.info(f"Loaded recipes")

    with open(DESTINATIONS_PATH, 'r', encoding='utf-8') as f:

        destinations = json.load(f)
    logger.info(f"Loaded destinations")

    if os.path.exists(MODEL_PATHS['model1']):
        model1 = load_model(MODEL_PATHS['model1'])
        logger.info("Model 1 loaded")

    if os.path.exists(MODEL_PATHS['model2']):
        from tensorflow.keras.layers import Conv2D, Layer, Dense, GlobalAveragePooling2D, GlobalMaxPooling2D, Reshape, Multiply, Add, Activation, Concatenate
        from tensorflow.keras import backend as K

        class CBAM(Layer):
            def __init__(self, filters, reduction_ratio=16, **kwargs):
                super(CBAM, self).__init__(**kwargs)
                self.filters = filters
                self.reduction_ratio = reduction_ratio

            def build(self, input_shape):
                self.shared_dense_one = Dense(self.filters // self.reduction_ratio, activation='relu', use_bias=True)
                self.shared_dense_two = Dense(self.filters, use_bias=True)
                self.conv_spatial = Conv2D(1, kernel_size=7, strides=1, padding='same', activation='sigmoid', use_bias=False)
                super(CBAM, self).build(input_shape)

            def call(self, input_tensor):
                avg_pool = GlobalAveragePooling2D()(input_tensor)
                max_pool = GlobalMaxPooling2D()(input_tensor)

                avg_pool = Reshape((1,1,self.filters))(avg_pool)
                max_pool = Reshape((1,1,self.filters))(max_pool)

                mlp_avg = self.shared_dense_two(self.shared_dense_one(avg_pool))
                mlp_max = self.shared_dense_two(self.shared_dense_one(max_pool))

                channel_attention = Activation('sigmoid')(Add()([mlp_avg, mlp_max]))
                channel_refined = Multiply()([input_tensor, channel_attention])

                avg_pool_spatial = K.mean(channel_refined, axis=-1, keepdims=True)
                max_pool_spatial = K.max(channel_refined, axis=-1, keepdims=True)

                concat = Concatenate(axis=-1)([avg_pool_spatial, max_pool_spatial])
                spatial_attention = self.conv_spatial(concat)
                refined_feature = Multiply()([channel_refined, spatial_attention])

                return refined_feature

            def get_config(self):
                return {'filters': self.filters, 'reduction_ratio': self.reduction_ratio}

        model2 = load_model(MODEL_PATHS['model2'], custom_objects={'CBAM': CBAM})
        logger.info("Model 2 (DenseNet169) loaded")

except Exception as e:
    logger.error(f"[LOAD ERROR] {e}")

# Register blueprints
from routes_api import api_bp, setup_models
from routes_web import web_bp, setup_web_context

app.register_blueprint(api_bp)
app.register_blueprint(web_bp)

# Gán model/class labels cho các route
setup_models({'model1': model1, 'model2': model2}, class_names)
setup_web_context({'model1': model1, 'model2': model2}, class_names, destinations)


if __name__ == '__main__':
    logger.info(f"Starting server on {HOST}:{PORT}")
    app.run(host=HOST, port=PORT, debug=True)

# Expose global models
__all__ = ['model1', 'model2', 'class_names', 'destinations']