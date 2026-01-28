# OESP (Offline Exchange Secure Protocol)

OESP est un protocole de communication sécurisé conçu pour l'échange de messages et de données dans des environnements partiellement déconnectés (offline-first).

Ce dépôt contient l'implémentation complète du protocole, incluant les SDK pour terminaux mobiles et serveurs, ainsi qu'un serveur de synchronisation.

## Structure du projet

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
