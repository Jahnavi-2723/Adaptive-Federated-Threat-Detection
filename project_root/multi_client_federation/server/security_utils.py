import numpy as np

def differential_privacy(weights, epsilon=1e-3):
    noisy = []
    for w in weights:
        noise = np.random.laplace(0, epsilon, w.shape)
        noisy.append(w + noise)
    return noisy
