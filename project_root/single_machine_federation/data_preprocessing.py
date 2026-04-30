import pandas as pd
import numpy as np
import os

def clean_domain(d):
    d = str(d).strip().lower()
    if d.startswith("www."):
        return d[4:]
    return d

def encode_domain(domain, seq_len=75, vocab_size=70):
    domain = clean_domain(domain)

    if len(domain) < seq_len:
        domain = domain + (" " * (seq_len - len(domain)))  # neutral padding
    else:
        domain = domain[:seq_len]

    return [ord(c) % vocab_size for c in domain]


def create_dataset(seq_len=75, vocab_size=70):
    # datasets folder is in project_root/datasets
    base = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", "datasets"))

    benign_path = os.path.join(base, "top-1m.csv")
    mal_path = os.path.join(base, "malicious_phish.csv")

    print("\n🔍 Loading datasets from:")
    print("   Benign  :", benign_path)
    print("   Malicious:", mal_path)

    # Load benign dataset (top-1m)
    benign_df = pd.read_csv(benign_path, header=None, names=["rank", "domain"])
    benign_domains = benign_df["domain"].astype(str).apply(clean_domain)

    # Load malicious dataset
    mal_df = pd.read_csv(mal_path)
    malicious_domains = mal_df["url"].astype(str).apply(
        lambda x: x.split("//")[-1].split("/")[0]  # extract domain from URL
    ).apply(clean_domain)

    # Balance dataset
    n = min(len(benign_domains), len(malicious_domains))
    benign_domains = benign_domains.sample(n, random_state=42)
    malicious_domains = malicious_domains.sample(n, random_state=42)

    # Labels
    labels = np.array([0]*n + [1]*n)
    domains = list(benign_domains) + list(malicious_domains)

    # Encode into numerical form
    X = np.array([encode_domain(d, seq_len, vocab_size) for d in domains])

    print(f"\n✅ Loaded {n} benign + {n} malicious = {2*n} total samples")

    return X, labels
