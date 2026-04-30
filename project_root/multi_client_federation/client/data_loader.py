import numpy as np
import random
import string

def random_domain(length=12):
    """Generate pseudo-random domain"""
    chars = string.ascii_lowercase + string.digits
    return ''.join(random.choice(chars) for _ in range(length)) + ".com"

def tokenize_domain(domain, seq_len=75, vocab_size=70):
    """Convert domain string into integer tokens"""
    tokens = np.zeros(seq_len, dtype=int)
    for i, c in enumerate(domain[:seq_len]):
        tokens[i] = ord(c) % vocab_size
    return tokens

def create_local_data(samples=400, seq_len=75):
    """Simulate local benign/malicious dataset for each federated client"""
    benign = [random_domain() for _ in range(samples // 2)]
    malicious = [random_domain() for _ in range(samples // 2)]
    all_domains = benign + malicious
    labels = np.array([0]*(samples//2) + [1]*(samples//2))

    X = np.array([tokenize_domain(d, seq_len) for d in all_domains])
    shuffle_idx = np.random.permutation(len(X))
    X, labels = X[shuffle_idx], labels[shuffle_idx]
    return X, labels

def split_train_test(X, y, ratio=0.8):
    """Split dataset into training and testing subsets"""
    idx = int(len(X) * ratio)
    return (X[:idx], y[:idx]), (X[idx:], y[idx:])
