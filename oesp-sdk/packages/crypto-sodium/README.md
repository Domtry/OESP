# @oesp/crypto-sodium

Implémentation de `CryptoProvider` pour OESP utilisant `libsodium-wrappers`. Compatible avec Node.js et les navigateurs.

## Installation

```bash
npm install @oesp/crypto-sodium
```

## Utilisation

```ts
import { createSodiumCryptoProvider } from '@oesp/crypto-sodium';

const crypto = await createSodiumCryptoProvider();
// Utilisez 'crypto' lors de l'initialisation d'OESPClient
```
