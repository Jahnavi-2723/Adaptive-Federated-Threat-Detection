import numpy as np
import random

def mutate_domain(domain):
    chars = list(domain)
    for _ in range(random.randint(1, 3)):
        idx = random.randint(0, len(chars)-1)
        chars[idx] = random.choice('abcdefghijklmnopqrstuvwxyz0123456789')
    return ''.join(chars)

def generate_adversarial_data(domains):
    adv = [mutate_domain(d) for d in domains]
    return np.array(adv)
