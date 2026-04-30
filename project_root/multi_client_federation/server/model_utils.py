import tensorflow as tf
import numpy as np
from common.model_definition import build_transformer_model

class ModelUtils:
    def __init__(self, vocab_size=70, seq_len=75):
        self.model = build_transformer_model(vocab_size=vocab_size, seq_len=seq_len)
        self.model.compile(optimizer='adam', loss='binary_crossentropy', metrics=['accuracy'])

    def get_weights(self):
        """Return model weights as numpy arrays"""
        return self.model.get_weights()

    def set_weights(self, weights):
        """Update global model weights"""
        self.model.set_weights(weights)

    def save_model(self, path="global_model.h5"):
        """Save model to disk"""
        self.model.save(path)
        print(f"[+] Global model saved at {path}")

    def load_model(self, path="global_model.h5"):
        """Load model from disk"""
        self.model = tf.keras.models.load_model(path)
        print(f"[+] Global model loaded from {path}")

    def aggregate_weights(self, client_weights):
        """Perform FedAvg aggregation across all clients"""
        new_weights = [np.mean(np.array(w), axis=0) for w in zip(*client_weights)]
        self.set_weights(new_weights)
        return new_weights
