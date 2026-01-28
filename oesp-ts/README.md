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

API cores: `OESPClient.getDid()`, `pack()`, `verify()`, `unpack()`

