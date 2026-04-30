import tensorflow as tf
from tensorflow.keras import layers, Model

def build_transformer_model(vocab_size=70, seq_len=75, embed_dim=64, num_heads=4, ff_dim=128):
    inputs = layers.Input(shape=(seq_len,))
    x = layers.Embedding(vocab_size, embed_dim)(inputs)
    attn_out = layers.MultiHeadAttention(num_heads=num_heads, key_dim=embed_dim)(x, x)
    x = layers.Add()([x, attn_out])
    x = layers.LayerNormalization()(x)
    x = layers.Dense(ff_dim, activation='relu')(x)
    x = layers.GlobalAveragePooling1D()(x)
    outputs = layers.Dense(1, activation='sigmoid')(x)
    return Model(inputs, outputs)
