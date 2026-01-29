# @oesp/all

Meta-package regroupant tous les modules du SDK OESP TypeScript.

## Installation

```bash
npm install @oesp/all
```

Ce package installe automatiquement :
- `@oesp/sdk` : Le cœur du SDK
- `@oesp/crypto-sodium` : Implémentation cryptographique utilisant libsodium
- `@oesp/storage-memory` : Stockage en mémoire pour les replays
- `@oesp/sync-http` : Client de synchronisation HTTP
- `@oesp/transport-ble-gatt` : Transport Bluetooth Low Energy (GATT)

## Utilisation

Vous pouvez importer tout le nécessaire depuis ce package :

```typescript
import { OESPClient, SodiumCryptoProvider, OESPBleGattTransport } from '@oesp/all';
```
