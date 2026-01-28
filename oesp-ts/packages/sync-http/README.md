# @oesp/sync-http

Client de synchronisation HTTP pour OESP.

## Installation

```bash
npm install @oesp/sync-http
```

## Utilisation

```ts
import { OESPSyncClient } from '@oesp/sync-http';

const client = new OESPSyncClient({
  baseUrl: 'https://mon-serveur-oesp.com'
});

const result = await client.syncTokens(
  ['OESP1.token1...', 'OESP1.token2...'],
  'oesp:did:my_device'
);

if (result.success) {
  console.log(`Synchronisation réussie: ${result.uploadedCount} tokens envoyés.`);
}
```
