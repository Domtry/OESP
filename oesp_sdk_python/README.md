# OESP SDK Python v0.2.3

SDK Python pour le protocole **OESP (Offline Exchange Secure Protocol)**. Cette version propose une architecture modulaire pour le transport et la synchronisation.

## Architecture

- **oesp_sdk/core**: Logique commune (DID, Canonicalisation, Enveloppe, Erreurs).
- **oesp_sdk/crypto**: Primitives cryptographiques (Ed25519, X25519, AEAD).
- **oesp_sdk/client**: Implémentation pour les terminaux mobiles/PC (Signer/Chiffrer).
- **oesp_sdk/server**: Implémentation pour les backends (Vérifier/Parser).
- **oesp_sdk/transport**: Modules de communication (BLE GATT) avec support asynchrone.
- **oesp_sdk/sync**: Client de synchronisation HTTP asynchrone.

## Installation

Le SDK peut être installé directement depuis les sources ou via pip (si publié).

### Depuis les sources (Développement)

```bash
# Cloner le repository
git clone https://github.com/Domtry/OESP.git
cd OESP/oesp_sdk_python

# Installation en mode éditable (recommandé pour le dev)
pip install -e .

# Installation des dépendances de développement
pip install -e ".[dev]"
```

### Via pip

```bash
pip install oesp-sdk
```

Il est recommandé d'utiliser un environnement virtuel ou **uv** :

## Utilisation Côté Client (Pack/Unpack)

Le client est responsable de la génération des clés, du chiffrement et de la signature.

```python
from oesp_sdk.client import OESPClient, MemoryKeystore
from oesp_sdk.core.adapters import Resolver

# 1. Initialiser le Keystore (Identity Ed25519 + KEX X25519)
keystore = MemoryKeystore()
client = OESPClient(keystore)

# 2. Créer un envelope (Ex: Scan d'un QR code contenant les clés publiques)
envelope = await client.pack_message(
    payload={"msg": "Hello Offline World"},
    recipient_did="did:oesp:target-device"
)
```

## Transport BLE GATT (Asynchrone)

Le module `oesp_sdk.transport` permet l'échange de données via Bluetooth Low Energy (BLE). Il utilise `asyncio` pour gérer les opérations non-bloquantes.

```python
import asyncio
from oesp_sdk.transport import OESPBleGattTransport, BleakLink
from bleak import BleakClient

async def send_token_via_ble(address, token_bytes):
    # 1. Connexion via Bleak (librairie asynchrone)
    async with BleakClient(address) as client:
        # 2. Initialiser le lien et le transport
        link = BleakLink(client)
        transport = OESPBleGattTransport()
        
        # 3. Envoyer le token (gère fragmentation et ACK)
        try:
            await transport.send_token(token_bytes, link)
            print("Token envoyé avec succès !")
        except Exception as e:
            print(f"Erreur de transport : {e}")

# asyncio.run(send_token_via_ble("AA:BB:CC:DD:EE:FF", b'...'))
```

## Synchronisation HTTP (Asynchrone)

Le module `oesp_sdk.sync` permet de synchroniser les tokens collectés vers un serveur central. Il supporte l'upload fragmenté (chunked) et la vérification d'intégrité.

```python
import asyncio
from oesp_sdk.sync import OESPSyncClient

async def sync_tokens():
    # 1. Initialiser le client sync
    client = OESPSyncClient(base_url="https://api.oesp.protocol")
    
    tokens = [
        "OESP1.token1...",
        "OESP1.token2..."
    ]
    
    # 2. Synchroniser
    try:
        result = await client.sync_tokens(
            tokens=tokens,
            device_did="oesp:did:my_device"
        )
        
        if result.success:
            print(f"Succès ! Session ID: {result.session_id}")
        else:
            print(f"Erreur: {result.error}")
            
    except Exception as e:
        print(f"Erreur réseau : {e}")

# asyncio.run(sync_tokens())
```
