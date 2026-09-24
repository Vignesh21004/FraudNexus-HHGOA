# FraudNexus — Agentic Fraud Investigation Command Center

A hackathon-ready reference implementation for the TigerGraph Agentic Fraud Investigation challenge.

**Core demo:** trigger -> graph investigation -> uncertainty -> controlled evidence request -> reassessment -> next-best-action -> approval route -> case memory.

## Run
```bash
python -m venv .venv
# Windows: .venv\Scripts\activate
# macOS/Linux: source .venv/bin/activate
pip install -r backend/requirements.txt
uvicorn backend.main:app --reload --port 8000
```
Open http://127.0.0.1:8000

## Demo
1. Start Investigation.
2. Watch the fraud network expand and the agent timeline.
3. Notice confidence starts at 54%, so the agent does not immediately block.
4. Simulate Verification Failed.
5. Watch confidence jump to 94% and recommendations update.
6. Open Why This Decision.
7. Explore Case Memory, Policy Guardrails and Replay.

## TigerGraph
The demo runs without credentials. Set TIGERGRAPH_HOST, TIGERGRAPH_TOKEN and TIGERGRAPH_GRAPH to connect the adapter to your deployment. The `tigergraph/` folder contains a starter schema and GSQL queries.

## Official dataset
The HHGOA_IEEE dataset is not redistributed here. Put the official dataset under `data/` and adapt `backend/benchmark.py` to its README/columns before benchmark scoring.

This is a working foundation, not a guarantee of hackathon selection; benchmark accuracy depends on the official data and validation.
