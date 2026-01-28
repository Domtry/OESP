# OESP (Offline Exchange Secure Protocol)

OESP est un protocole de communication sécurisé conçu pour l'échange de messages et de données dans des environnements partiellement déconnectés (offline-first).

## Pourquoi OESP ? (Domaines d'application)

OESP répond aux défis des systèmes où une connexion Internet permanente n'est pas garantie ou n'est pas souhaitable pour des raisons de sécurité :

- **IoT & Smart Industry** : Capteurs et machines échangeant des données de diagnostic via BLE ou NFC dans des zones blanches.
- **Logistique & Supply Chain** : Suivi de colis où les terminaux de scan synchronisent leurs données par intermittence.
- **Réseaux Mesh & Peer-to-Peer** : Communication directe entre appareils (smartphone à smartphone) sans passer par un serveur central.
- **Sécurité Critique** : Systèmes nécessitant une preuve d'origine (signature) et une confidentialité absolue (chiffrement de bout en bout) même en mode asynchrone.
- **Zones Rurales/Isolées** : Applications de santé ou de gestion de ressources fonctionnant en local et synchronisant les données une fois par jour.

## Flux de communication détaillé (A -> B)

Le protocole garantit que Device A peut envoyer une donnée à Device B de manière à ce que seul B puisse la lire, et que B soit certain que la donnée provient de A.

### Schéma du processus

```mermaid
sequence_diagram
    participant A as Device A (Sender)
    participant B as Device B (Recipient)

    Note over A: 1. Gènere Ephemeral Key\n2. Chiffre Payload (ChaCha20)\n3. Scelle Session Key (X25519)\n4. Signe Enveloppe (Ed25519)
    A->>B: OESP Token (via BLE, QR, Sync...)
    Note over B: 5. Vérifie Signature (Ed25519)\n6. Ouvre Sealed Box (X25519)\n7. Déchiffre Payload (ChaCha20)\n8. Valide Exp/Replay
```

### Exemple Visuel de la Donnée

Voici l'évolution d'un message durant son cycle de vie OESP :

#### 1. Donnée originale (Plaintext)
C'est l'information que vous voulez protéger.
```json
{
  "action": "unlock_door",
  "id": "front_gate_01"
}
```

#### 2. Chiffrement (Ciphertext)
La donnée est transformée en un bloc binaire illisible via une clé de session unique.
```text
// Plaintext + Key + IV -> Ciphertext
ct: "7b8a9c2d1e..." (Base64URL)
```

#### 3. L'Enveloppe OESP (Metadata)
On entoure le message chiffré (`ct`) de métadonnées de sécurité.
```json
{
  "v": 1,
  "typ": "oesp.envelope",
  "mid": "z8X9p...",
  "ts": 1706457600,
  "exp": 1706458200,
  "from": {
    "did": "oesp:did:alice...",
    "pub": "A1b2C..."
  },
  "to": { "did": "oesp:did:bob..." },
  "enc": "CHACHA20-POLY1305",
  "kex": "X25519",
  "ek": "Scellé pour Bob...",
  "iv": "Vecteur d'initialisation",
  "ct": "7b8a9c2d1e...",
  "sig_alg": "Ed25519",
  "sig": "Signature d'Alice sur tout ce qui précède"
}
```

#### 4. Le Token Final (Transport)
L'enveloppe est canonisée et encodée en Base64URL pour être facilement transmise.
```text
OESP1.eyJ2IjoxLCJ0eXAiOiJvZXNwLmVudmVsb3BlIiwibWlkIjoiejhYOXA... (Tronqué)
```

### 1. Création de l'Identité (DID)
Chaque appareil génère une paire de clés **Ed25519**.
- Le **DID** est calculé de manière déterministe : `oesp:did:base32(sha256(public_key))`.
- Ce DID sert d'adresse unique et publique.

### 2. Préparation de l'envoi (Device A)
Pour envoyer `{"temp": 22}` à Device B :
1. **Key Exchange (KEX)** : A récupère la clé publique **X25519** de B (via un QR code, un serveur de clés ou un échange précédent).
2. **Chiffrement** : A génère une clé de session éphémère, chiffre la donnée avec **ChaCha20-Poly1305** et scelle cette clé pour B via une "Sealed Box" X25519.
3. **Signature** : A crée une enveloppe contenant les métadonnées (émetteur, destinataire, timestamp, expiration) et signe l'ensemble (métadonnées + texte chiffré) avec sa clé privée **Ed25519**.
4. **Token** : Le résultat est un token compact `OESP1.<base64url_json_envelope>`.

### 3. Transport
Le token peut être transmis par n'importe quel canal :
- **BLE** (via fragmentation OESP-GATT).
- **Serveur de Synchro** (via OESP-SYNC).
- **QR Code / NFC**.

### 4. Réception et Décodage (Device B)
À la réception du token par B :
1. **Vérification** : B vérifie la signature Ed25519 de A. Si la signature est valide, B est certain que l'enveloppe n'a pas été modifiée et provient bien de A.
2. **Décryptage** : B utilise sa clé privée X25519 pour ouvrir la "Sealed Box", récupérer la clé de session, et déchiffrer la donnée originale.
3. **Validation** : B vérifie les contraintes (le message est-il expiré ? a-t-il déjà été traité ?).

## Structure du projet

Ce dépôt contient l'implémentation complète du protocole, incluant les SDK pour terminaux mobiles et serveurs, ainsi qu'un serveur de synchronisation.

- **[oesp_sdk_python/](./oesp_sdk_python)** : SDK Python (Client & Serveur). Utilisable sur PC, serveurs Linux et systèmes embarqués supportant Python.
- **[oesp_sdk_ts/](./oesp_sdk_ts)** : SDK TypeScript / React Native. Optimisé pour les applications mobiles Android/iOS.
- **[oesp_sync_server/](./oesp_sync_server)** : Serveur de synchronisation haute performance (FastAPI + PostgreSQL) permettant de centraliser les journaux de messages offline.

## Fonctionnement du protocole

OESP repose sur une architecture d'enveloppe cryptographique :
1. **Identité** : Chaque terminal possède un DID (Decentralized Identifier) dérivé de sa clé publique Ed25519.
2. **Confidentialité** : Les messages sont chiffrés de bout en bout via X25519 (Key Exchange) et ChaCha20-Poly1305.
3. **Intégrité** : Chaque enveloppe est signée numériquement avec Ed25519.
4. **Résilience** : Le protocole supporte l'anti-rejeu et l'expiration des tokens.

## Guide d'intégration

### 1. Développement Mobile (React Native)
Utilisez le SDK TypeScript pour générer et échanger des tokens sécurisés, même sans connexion Internet.
```bash
npm install @oesp/sdk
```

### 2. Backend / Serveur
Utilisez le SDK Python pour vérifier l'authenticité des tokens reçus.
```bash
pip install oesp-sdk
```

### 3. Synchronisation
Déployez le serveur OESP-SYNC pour permettre aux terminaux de synchroniser leurs journaux de messages dès qu'une connexion Internet est disponible.
```bash
cd oesp_sync_server
docker-compose up --build
```

## Documentation détaillée

- [Documentation SDK Python](./oesp_sdk_python/README.md)
- [Documentation SDK TypeScript](./oesp_sdk_ts/README.md)
- [Documentation Serveur de Synchro](./oesp_sync_server/README.md)

## Licence

MIT
