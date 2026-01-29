# OESP TypeScript SDK

GitHub: [https://github.com/Domtry/OESP](https://github.com/Domtry/OESP)

## Installation

Pour installer l'intégralité du SDK :
```bash
npm install @oesp/all
```

Ou installez uniquement les packages dont vous avez besoin :
```bash
npm install @oesp/sdk @oesp/crypto-sodium @oesp/storage-memory
```

## Packages

- `@oesp/all` — Meta-package incluant tous les modules
- `@oesp/sdk` — Core universel (agnostique)
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

## Utilisation Rapide (Node.js)

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

## Exemples Avancés

### Gestion des Erreurs

Il est recommandé d'entourer les opérations critiques de blocs `try/catch` pour gérer les erreurs potentielles lors du chiffrement, déchiffrement ou de la communication.

```ts
try {
  const message = "Hello Secure World";
  // Exemple d'opération (fictive)
  const packed = await client.pack({
    to: "did:oesp:destinataire...",
    message: new TextEncoder().encode(message)
  });
  console.log("Message chiffré:", packed);
} catch (error) {
  console.error("Erreur lors de l'opération OESP:", error);
}
```

### Utilisation dans un Navigateur

Pour une utilisation dans un navigateur, assurez-vous d'utiliser un bundler comme Vite ou Webpack. L'exemple ci-dessous montre comment initialiser le client.

```ts
import { OESPClient } from '@oesp/sdk';
import { createSodiumCryptoProvider } from '@oesp/crypto-sodium';
// Note: Utilisez une implémentation de stockage adaptée au navigateur (ex: localStorage ou IndexedDB)
// import { BrowserKeyStore } from '@oesp/keystore-browser'; // (Hypothétique)
import { MemoryReplayStore } from '@oesp/storage-memory';

async function init() {
  await createSodiumCryptoProvider(); // Initialise libsodium
  // ... configuration du client
}
```

API cores: `OESPClient.getDid()`, `pack()`, `verify()`, `unpack()`

