# @oesp/storage-memory

Implémentation de `ReplayStore` en mémoire pour OESP. Utile pour les tests ou les sessions éphémères.

## Installation

```bash
npm install @oesp/storage-memory
```

## Utilisation

```ts
import { MemoryReplayStore } from '@oesp/storage-memory';

const replay = new MemoryReplayStore();
```
