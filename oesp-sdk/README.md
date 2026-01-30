# OESP TypeScript SDK

GitHub: [https://github.com/Domtry/OESP](https://github.com/Domtry/OESP)

## Installation

Pour installer l'intégralité du SDK :
```bash
npm install @oesp/all
```

Ou installez uniquement les packages dont vous avez besoin :
```bash
npm install @oesp/core @oesp/crypto-sodium @oesp/storage-memory
```

## Packages

- `@oesp/all` — Meta-package incluant tous les modules
- `@oesp/core` — Core universel (agnostique)
- `@oesp/crypto-sodium` — CryptoProvider via libsodium (Node+Browser)
- `@oesp/keystore-node` — KeyStore fichier JSON (Node)
- `@oesp/storage-memory` — ReplayStore en mémoire
- `@oesp/sync-http` — Client de synchronisation HTTP
- `@oesp/transport-ble-gatt` — Transport Bluetooth Low Energy (GATT)

## Build & Tests

```bash
npm install
npm run build
npm test
```

## Utilisation

Pour un guide complet de mise en œuvre (Identité, Transport BLE, Synchronisation HTTP), consultez le **[Tutoriel Pas à Pas du Meta-Package @oesp/all](./packages/all/README.md#tutoriel-complet--de-lidentité-au-transfert)**.

### Aperçu Rapide (Node.js)

```ts
import { OESPClient, createSodiumCryptoProvider, NodeFileKeyStore, MemoryReplayStore } from '@oesp/all'

const crypto = await createSodiumCryptoProvider()
const keystore = new NodeFileKeyStore('.data/identity.json')
const replay = new MemoryReplayStore()

const client = new OESPClient({ crypto, keystore, replay })

// Obtenir mon DID
const myDid = await client.getDid()
console.log("Mon DID:", myDid)
```

API cores: `OESPClient.getDid()`, `pack()`, `verify()`, `unpack()`

