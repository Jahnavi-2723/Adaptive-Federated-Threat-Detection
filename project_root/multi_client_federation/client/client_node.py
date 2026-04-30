from data_loader import create_local_data, split_train_test
from common.model_definition import build_transformer_model
import requests, numpy as np

SERVER_URL = "http://127.0.0.1:5000"

# Load simulated data
X, y = create_local_data()
(train_x, train_y), (test_x, test_y) = split_train_test(X, y)

# Train locally
model = build_transformer_model()
model.compile(optimizer='adam', loss='binary_crossentropy', metrics=['accuracy'])
model.fit(train_x, train_y, epochs=2, verbose=0, validation_data=(test_x, test_y))

# Upload weights to server
weights = [w.tolist() for w in model.get_weights()]
requests.post(f"{SERVER_URL}/upload", json={'weights': weights})
print("✅ Local weights uploaded to server.")
