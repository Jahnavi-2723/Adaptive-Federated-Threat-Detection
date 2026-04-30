import random

def homoglyph_attack(domain):
    mapping = {'a': '@', 'i': '1', 'o': '0', 's': '$', 'e': '3'}
    return ''.join(mapping.get(c, c) for c in domain)

def random_noise(domain):
    idx = random.randint(0, len(domain)-1)
    return domain[:idx] + random.choice('abcdefghijklmnopqrstuvwxyz') + domain[idx+1:]

def augment(domains):
    aug = []
    for d in domains:
        if random.random() < 0.5:
            aug.append(homoglyph_attack(d))
        else:
            aug.append(random_noise(d))
    return aug
