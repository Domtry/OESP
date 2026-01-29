# @oesp/sdk

Le cœur du SDK OESP (Open Entrust & Sync Protocol). Ce package est agnostique de la plateforme et contient la logique fondamentale de pack, unpack et verify.

## Installation

```bash
npm install @oesp/sdk
```

## Utilisation

```ts
import { OESPClient } from '@oesp/sdk';

// Nécessite un CryptoProvider, un KeyStore et un ReplayStore
const client = new OESPClient({ crypto, keystore, replay });
```
