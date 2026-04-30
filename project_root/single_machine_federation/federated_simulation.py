import numpy as np
from tensorflow.keras import Model
from transformer_model import build_transformer_model
from data_preprocessing import create_dataset

class FederatedSimulator:
    def __init__(self, num_clients=5):
        self.clients = [build_transformer_model() for _ in range(num_clients)]
        self.global_model = build_transformer_model()

    def aggregate(self, client_weights):
        new_weights = [np.mean(np.array(w), axis=0) for w in zip(*client_weights)]
        self.global_model.set_weights(new_weights)

    def simulate_round(self, x_splits, y_splits):
        weights = []
        for i, model in enumerate(self.clients):
            model.compile(optimizer='adam', loss='binary_crossentropy', metrics=['accuracy'])
            model.fit(x_splits[i], y_splits[i], epochs=2, verbose=1)
            weights.append(model.get_weights())
        self.aggregate(weights)

print("Loading real dataset...")
X, y = create_dataset()

print("Splitting for 5 clients...")
X_splits = np.array_split(X, 5)
y_splits = np.array_split(y, 5)

fed = FederatedSimulator(num_clients=5)

for r in range(5):
    print(f"\n=== Federated Round {r+1} ===")
    fed.simulate_round(X_splits, y_splits)

fed.global_model.save("federated_transformer.h5")
print("\n🎉 New Federated Transformer Model Saved!")
