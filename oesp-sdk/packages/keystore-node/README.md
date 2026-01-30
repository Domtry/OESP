# @oesp/keystore-node

Implémentation de `KeyStore` pour OESP stockant l'identité dans un fichier JSON local. Conçu pour les environnements Node.js.

## Installation

```bash
npm install @oesp/keystore-node
```

## Utilisation

```ts
import { NodeFileKeyStore } from '@oesp/keystore-node';

const keystore = new NodeFileKeyStore('./identity.json');
// L'identité sera créée automatiquement si le fichier n'existe pas
```
