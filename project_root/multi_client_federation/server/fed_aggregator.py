import numpy as np

class FedAggregator:
    def __init__(self):
        self.all_weights = []

    def collect(self, weights):
        self.all_weights.append(weights)

    def aggregate(self):
        if not self.all_weights:
            return None
        agg = [np.mean(np.array(w), axis=0) for w in zip(*self.all_weights)]
        self.all_weights.clear()
        return agg
