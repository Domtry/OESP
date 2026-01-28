# OESP SDK Python v0.2.0

SDK Python pour le protocole **OESP (Offline Exchange Secure Protocol)**. Cette version propose une architecture duale Client/Serveur.

## Architecture

- **oesp_sdk/core**: Logique commune (DID, Canonicalisation, Enveloppe, Erreurs).
- **oesp_sdk/crypto**: Primitives cryptographiques (Ed25519, X25519, AEAD).
- **oesp_sdk/client**: Implémentation pour les terminaux mobiles/PC (Signer/Chiffrer).
- **oesp_sdk/server**: Implémentation pour les backends (Vérifier/Parser).

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

# 2. Implémenter un Resolver pour trouver les clés publiques des destinataires
class MyResolver:
    def resolve_did(self, did: str) -> bytes:
        # Retourne la clé publique X25519 du destinataire
        return b"..." 

client = OESPClient(keystore, resolver=MyResolver())

# 3. Créer un token sécurisé
token = client.pack("oesp:did:recipient_id", {"message": "top secret"})

# 4. Ouvrir un token reçu
decoded = client.unpack(token)
print(decoded["plaintext"])
```

## Gestion des DID (Identité)

Vous pouvez récupérer votre propre DID ou calculer le DID d'une clé publique arbitraire.

### Via le Client (Recommandé)
```python
# Récupère le DID associé à la clé publique du keystore
my_did = client.get_did()
print(f"Mon DID : {my_did}")
```

### Via la fonction utilitaire (Bas niveau)
```python
from oesp_sdk.core.did import derive_did

# Si vous avez une clé publique brute (bytes)
pub_key_bytes = b"..." 
did = derive_did(pub_key_bytes)
```

## Utilisation Côté Serveur (Verify/Parse)

Le serveur ne possède pas de clés privées. Il vérifie uniquement l'intégrité et applique les politiques de sécurité.

```python
from oesp_sdk.server import verify_token, ServerPolicy, InMemoryReplayStore

# 1. Politique de sécurité
policy = ServerPolicy(
    allow_expired=False,
    max_clock_skew_sec=300
)

# 2. Store pour l'anti-rejeu
replay_store = InMemoryReplayStore()

# 3. Vérifier un token
try:
    result = verify_token(
        token, 
        policy=policy, 
        replay_store=replay_store
    )
    print(f"Token valide de: {result['signer_did']}")
except Exception as e:
    print(f"Token invalide: {e}")
```

## Security Notes

- **Serveur sans clés**: Le module `server` est conçu pour fonctionner sans accès aux clés privées. Il ne peut ni signer ni chiffrer.
- **Vérifications**: Le serveur vérifie systématiquement:
    - La structure de l'enveloppe.
    - La correspondance entre le DID et la clé publique fournie (`derive_did(pub)`).
    - La signature Ed25519 sur l'ensemble de l'enveloppe et du ciphertext.
    - L'expiration (`exp`) et la cohérence temporelle (`ts`).
    - L'anti-rejeu via le message ID (`mid`).
- **Limites**: Le serveur ne déchiffre pas le contenu (`ct`). Si le serveur doit accéder au contenu, il doit être traité comme un "client" avec son propre Keystore.

## Plan de Migration (v0.1.x -> v0.2.x)

1. **Imports**: 
   - Ancien: `from oesp.client import OESPClient`
   - Nouveau: `from oesp_sdk.client import OESPClient`
2. **Types**: 
   - `EnvelopeV1` est maintenant une dataclass dans `oesp_sdk.core.envelope`. Utilisez `.to_dict()` si vous avez besoin du dictionnaire brut.
3. **Exceptions**: 
   - Les exceptions ont été déplacées dans `oesp_sdk.core.errors`.
4. **Server**: 
   - Si vous utilisiez `OESPClient.verify` sur le serveur, remplacez par `oesp_sdk.server.verify_token`.
