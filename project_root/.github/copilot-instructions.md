## Quick goal
Help contributors and AI agents make small, safe changes to the federated-learning demo code. Focus on running the simulator, understanding where models and weights live, and how clients/servers communicate.

## Big-picture architecture (what to know first)
- api_deployment/: Flask dashboard + prediction API that loads a saved Keras model (`api_deployment/app.py`, `api_deployment/model_loader.py`). The model file used is `federated_transformer.h5` (root or inside `single_machine_federation`).
- multi_client_federation/: Minimal multi-process federated flow made of:
  - `server/server.py` — a tiny Flask aggregator that exposes `/upload` (POST client weights) and `/aggregate` (GET aggregated weights). Uses `fed_aggregator.FedAggregator`.
  - `server/fed_aggregator.py` — collects lists of weight arrays and averages them with NumPy (FedAvg).
  - `client/local_training.py` and `client/client_node.py` — simple client scripts that train a local model (`common/model_definition.py`) and POST weights to the server.
  - `common/model_definition.py` — the transformer architecture (vocab_size=70, seq_len=75) used across client/server.
- single_machine_federation/: in-process simulator and utilities. `main.py` and `federated_simulation.py` create many model instances, run local training rounds, then aggregate in-process and save `federated_transformer.h5`.

## How federated learning works in this project (concrete)
1. Each client builds the same model architecture with `build_transformer_model()` from `common/model_definition.py`.
2. Clients train locally on private data, call `model.get_weights()` and send those weights to the aggregator via HTTP POST to `/upload` (see `client/local_training.py` and `client/client_node.py`).
3. The aggregator stores received weight lists in memory (`fed_aggregator.py`). When asked to aggregate (or when the simulation triggers it), it computes element-wise means across client weight arrays (FedAvg) and returns or sets the new global weights.
4. The global model can be set via `ModelUtils.set_weights()` and saved to disk (see `server/model_utils.py` and the single-machine simulator flow).

## Important patterns & conventions to preserve
- Weight representation: weights are JSON-serializable lists of lists. Clients convert NumPy arrays to lists before POSTing; aggregator converts back with `np.array` and uses `np.mean` for aggregation.
- Model shape assumptions: embedding vocab_size=70 and sequence length=75 are hard-coded defaults — changing them requires coordinating client and server code (`common/model_definition.py`).
- Model file locations: `federated_transformer.h5` may appear at repository root and inside `single_machine_federation/` and `api_deployment/`. `api_deployment/model_loader.py` checks multiple paths — prefer reusing that loader.
- Security: a simple DP helper exists (`server/security_utils.py`) that adds Laplace noise; it is intentionally minimal and not production-ready.

## Developer workflows (commands you'll actually run)
- Start the aggregator (multi-client HTTP aggregator):
  python .\multi_client_federation\server\server.py
  - Server listens on port 5000 and exposes `/upload` and `/aggregate`.
- Run a single client upload (example):
  python .\multi_client_federation\client\local_training.py
  - This trains a tiny local model and POSTs weights to the aggregator at `http://127.0.0.1:5000`.
- Run the single-machine federated simulation (fast way to produce a global model):
  python .\single_machine_federation\main.py
  - This runs `FederatedSimulator`, simulates rounds, and writes `federated_transformer.h5`.
- Run the dashboard / model server:
  python .\api_deployment\app.py
  - Flask app (port 7000) that loads `federated_transformer.h5` and serves `/predict`, `/metrics`, `/dashboard`, etc.

## Files to inspect for small changes (examples)
- To change the model architecture: edit `multi_client_federation/common/model_definition.py` and then update any scripts that construct models (clients, simulator, server `ModelUtils`).
- To change the aggregation strategy: edit `multi_client_federation/server/fed_aggregator.py` or `multi_client_federation/server/model_utils.py` (both implement averaging; pick the central place used by the flow you target).
- To add DP or secure aggregation hooks: inspect `multi_client_federation/server/security_utils.py` and the client upload path `client/client_node.py`.

## Examples to copy/paste (agent-friendly)
- POST weights payload (client -> aggregator): JSON body {"weights": [[...], [...], ...]} where each inner list is a weight array converted with `.tolist()`.
- Aggregation implementation (already in repo):
  new_weights = [np.mean(np.array(w), axis=0) for w in zip(*self.all_weights)]

## Minimal dependency checklist (discovered from imports)
- Python packages: tensorflow, flask, numpy, requests, scikit-learn, matplotlib, shap. There is no `requirements.txt`; run `pip install tensorflow flask numpy requests scikit-learn matplotlib shap` in your environment.

## Safety & scope notes for AI agents
- Don't change the model input shape or vocab size without changing all clients/simulator/server — doing so will break weight shapes and make aggregation invalid.
- Avoid adding persistent secrets or external network calls; the repo is designed for local experimentation.

If anything above is unclear or you want the file to contain runnable examples or unit tests, tell me which area to expand and I will iterate.
