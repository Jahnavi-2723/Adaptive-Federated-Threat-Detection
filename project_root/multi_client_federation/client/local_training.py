import os
import sys
import numpy as np

# Ensure the sibling 'common' package can be imported when running this script directly
# Try package-relative import first (works when invoked as a package),
# otherwise fall back to adding the parent folder to sys.path and
# importing the top-level `common` package (works when running file directly).
try:
    from ..common.model_definition import build_transformer_model
except Exception:
    _THIS_DIR = os.path.dirname(os.path.abspath(__file__))
    # parent is multi_client_federation/; adding it lets `import common...` work
    _PARENT_DIR = os.path.dirname(_THIS_DIR)
    if _PARENT_DIR not in sys.path:
        sys.path.insert(0, _PARENT_DIR)
    from common.model_definition import build_transformer_model


def train_local_model():
    model = build_transformer_model()
    x = np.random.randint(0, 70, (300, 75))
    y = np.random.randint(0, 2, 300)
    model.compile(optimizer='adam', loss='binary_crossentropy', metrics=['accuracy'])
    model.fit(x, y, epochs=3, verbose=0)
    return model.get_weights()
