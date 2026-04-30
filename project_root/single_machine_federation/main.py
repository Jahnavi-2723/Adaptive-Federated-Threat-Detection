import numpy as np
from federated_simulation import FederatedSimulator
from adversarial_gan import generate_adversarial_data

# Generate dummy data (simulate benign/malicious)
domains = np.random.randint(0, 70, (1000, 75))
labels = np.random.randint(0, 2, 1000)
split = np.array_split(domains, 5)
split_y = np.array_split(labels, 5)

fed = FederatedSimulator(num_clients=5)
for r in range(3):
    fed.simulate_round(split, split_y)
    print(f"Round {r+1} complete.")

fed.global_model.save("federated_transformer.h5")
print("✅ Global Model Saved")
