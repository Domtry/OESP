# @oesp/sync-http

Client de synchronisation HTTP pour OESP avec support des uploads fragmentés et vérification d'intégrité.

## Installation

```bash
npm install @oesp/sync-http
```

## Fonctionnalités

- **Upload par Session** : Création de session pour gérer les gros volumes de données.
- **Envoi Fragmenté (Chunked)** : Découpage automatique des données pour éviter les timeouts et respecter les limites du serveur.
- **Vérification d'Intégrité** : Calcul du hash SHA-256 pour chaque fragment envoyé.
- **Opérations Asynchrones** : Gestion non-bloquante des requêtes réseau via `fetch`.
- **Crypto Agnostique** : Injection du provider SHA-256.

## Utilisation

```ts
import { OESPSyncClient } from '@oesp/sync-http';
import { sha256 } from 'js-sha256'; // Exemple de lib externe

// 1. Initialiser le client avec l'URL du serveur et le provider SHA-256
const client = new OESPSyncClient({
  baseUrl: 'https://mon-serveur-oesp.com',
  sha256: async (data) => new Uint8Array(sha256.arrayBuffer(data))
});

// 2. Préparer les tokens à synchroniser (format string base64url ou raw)
const tokensToSync = [
  'OESP1.token1...',
  'OESP1.token2...'
];

const deviceDid = 'oesp:did:my_device';

try {
  // 3. Lancer la synchronisation asynchrone
  // La méthode gère automatiquement la création de session, le découpage et l'upload
  const result = await client.syncTokens(
    tokensToSync,
    deviceDid
  );

  if (result.success) {
    console.log(`Synchronisation réussie !`);
    console.log(`Tokens envoyés : ${result.uploadedCount}`);
    console.log(`ID de session : ${result.sessionId}`);
  } else {
    console.error(`Erreur de synchro : ${result.error}`);
  }
} catch (err) {
  console.error("Erreur réseau ou client:", err);
}
```

## Configuration Avancée

Vous pouvez ajuster la taille des chunks lors de l'initialisation :

```ts
const client = new OESPSyncClient({
  baseUrl: 'https://api.oesp.com',
  sha256: mySha256Provider,
  chunkSize: 1024 * 1024 // 1MB par chunk (défaut: 512KB)
});
```
