import os
import tensorflow as tf

def load_model(path):
    # Try to load from both locations automatically
    base_dir = os.path.dirname(os.path.dirname(__file__))
    root_path = os.path.join(base_dir, path)
    api_path = os.path.join(base_dir, "api_deployment", path)

    if os.path.exists(api_path):
        model_path = api_path
    elif os.path.exists(root_path):
        model_path = root_path
    else:
        raise FileNotFoundError(f"Model file '{path}' not found in either {api_path} or {root_path}")

    print(f"🔍 Loading model from: {model_path}")
    return tf.keras.models.load_model(model_path)
