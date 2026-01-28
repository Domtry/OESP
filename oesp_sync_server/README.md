# OESP-SYNC Server

Serveur de synchronisation pour le protocole OESP (Offline Exchange Secure Protocol). Permet de synchroniser des journaux de messages locaux vers un backend centralisé de manière sécurisée et résiliente.

## Architecture

Le serveur reçoit des flux JSONL fragmentés en chunks. Il reconstitue le flux, vérifie chaque token OESP (signature, DID, politique) et les stocke en base de données PostgreSQL.

## Stack Technique

- **FastAPI** : Framework web asynchrone.
- **SQLModel** : ORM basé sur SQLAlchemy et Pydantic.
- **PostgreSQL** : Stockage persistant.
- **OESP SDK** : Utilisé pour la validation des tokens.

## Lancement Local (avec uv)

```bash
cd oesp_sync_server
uv venv
source .venv/bin/activate
uv pip install -e ../oesp_sdk_python
uv pip install -e .
uvicorn app.main:app --reload
```

## Lancement avec Docker Compose

```bash
cd oesp_sync_server
docker-compose up --build
```

Le serveur sera accessible sur `http://localhost:8000`.

## Exemple de Synchronisation (Curl)

### 1. Démarrer une session
```bash
curl -X POST http://localhost:8000/v1/sync/start \
  -H "X-OESP-DEVICE: oesp:did:test_device" \
  -H "Content-Type: application/json" \
  -d '{
    "device_did": "oesp:did:test_device",
    "device_pub_b64": "...",
    "expected_total_bytes": 1024,
    "expected_total_items": 2
  }'
```

### 2. Envoyer un chunk
```bash
curl -X POST http://localhost:8000/v1/sync/<session_id>/chunk \
  -H "X-OESP-DEVICE: oesp:did:test_device" \
  -H "Content-Type: application/json" \
  -d '{
    "seq": 0,
    "payload_b64": "<base64_jsonl_chunk>",
    "sha256_b64": "<sha256_of_chunk>"
  }'
```

### 3. Vérifier le statut
```bash
curl http://localhost:8000/v1/sync/<session_id>/status \
  -H "X-OESP-DEVICE: oesp:did:test_device"
```

### 4. Commiter la session
```bash
curl -X POST http://localhost:8000/v1/sync/<session_id>/commit \
  -H "X-OESP-DEVICE: oesp:did:test_device" \
  -H "Content-Type: application/json" \
  -d '{
    "final_hash_b64": "<sha256_of_all_payloads_concatenated>",
    "allow_expired": true
  }'
```

## Format JSONL attendu

Le journal doit être un fichier JSON Lines où chaque ligne est un objet JSON contenant une clé `token` :

```json
{"token": "OESP1.eyJjdCI6..."}
{"token": "OESP1.eyJjdCI6..."}
{"token": "OESP1.eyJjdCI6..."}
```

## Calcul du `final_hash` côté client

Le `final_hash` est le SHA256 de la concaténation brute de tous les payloads de chunks envoyés, dans l'ordre de leurs séquences (0, 1, 2...).

## Intégration du SDK OESP

Le serveur dépend du module `oesp_sdk`. Dans le `Dockerfile`, il est installé via `uv` :
```bash
uv pip install --system -e /oesp_sdk_python
```
En développement local, utilisez `uv pip install -e ../oesp_sdk_python` pour lier le SDK.
