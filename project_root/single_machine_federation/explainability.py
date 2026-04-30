import matplotlib.pyplot as plt
import numpy as np

def visualize_attention(attn_map, domain_tokens):
    plt.figure(figsize=(10,4))
    plt.imshow(attn_map, cmap='hot', interpolation='nearest')
    plt.xticks(range(len(domain_tokens)), domain_tokens, rotation=90)
    plt.colorbar()
    plt.title("Transformer Attention Heatmap")
    plt.show()
