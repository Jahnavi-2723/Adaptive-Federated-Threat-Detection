from flask import Flask, request, jsonify
import numpy as np
from fed_aggregator import FedAggregator

app = Flask(__name__)
aggregator = FedAggregator()

@app.route('/upload', methods=['POST'])
def upload_weights():
    data = request.get_json()
    weights = [np.array(w) for w in data['weights']]
    aggregator.collect(weights)
    return jsonify({"status":"received"})

@app.route('/aggregate', methods=['GET'])
def aggregate():
    new_weights = aggregator.aggregate()
    return jsonify({"global_weights": [w.tolist() for w in new_weights]})

if __name__ == '__main__':
    app.run(port=5000)
