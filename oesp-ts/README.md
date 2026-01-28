# OESP TypeScript Monorepo

GitHub: [https://github.com/domtry/oesp/oesp-ts](https://github.com/domtry/oesp/oesp-ts)

Packages:
- `@oesp/sdk` — core universel (agnostique)
- `@oesp/crypto-sodium` — CryptoProvider via libsodium (Node+Browser)
- `@oesp/keystore-node` — KeyStore fichier JSON (Node)
- `@oesp/storage-memory` — ReplayStore en mémoire
- (optionnels) `crypto-react-native`, `keystore-react-native`, `storage-sqlite-*`

Build: `npm install && npm run build`

Tests: `npm test`

Exemples:
- Node: `cd examples/node-demo && pnpm build && node dist/index.js`
- Browser: servez `examples/browser-demo/index.html` via un serveur statique
- React Native: voir `examples/react-native-demo/README.md`

Initialisation (Node):
```ts
import { OESPClient } from '@oesp/sdk'
import { createSodiumCryptoProvider } from '@oesp/crypto-sodium'
import { NodeFileKeyStore } from '@oesp/keystore-node'
import { MemoryReplayStore } from '@oesp/storage-memory'

const crypto = await createSodiumCryptoProvider()
const keystore = new NodeFileKeyStore('.data/identity.json')
const replay = new MemoryReplayStore()
const client = new OESPClient({ crypto, keystore, replay })
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

