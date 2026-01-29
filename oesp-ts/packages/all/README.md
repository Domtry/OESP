# @oesp/all

Meta-package officiel regroupant l'intégralité du SDK OESP (Open Entrust & Sync Protocol) pour TypeScript.

Ce package est conçu pour offrir une expérience "tout-en-un", incluant le cœur du protocole, les implémentations cryptographiques, ainsi que les modules de transport (BLE) et de synchronisation asynchrone (HTTP).

## Sommaire
- [Installation](#installation)
- [Modules Inclus](#modules-inclus)
- [Tutoriel Complet : De l'Identité au Transfert](#tutoriel-complet--de-lidentité-au-transfert)
    - [1. Initialisation](#1-initialisation)
    - [2. Création du Message (Pack)](#2-création-du-message-pack)
    - [3. Transfert Physique (Transport BLE)](#3-transfert-physique-transport-ble)
    - [4. Synchronisation Cloud (Async HTTP)](#4-synchronisation-cloud-async-http)
    - [5. Réception et Lecture (Unpack)](#5-réception-et-lecture-unpack)

---

## Installation

```bash
npm install @oesp/all
```

## Modules Inclus

En installant `@oesp/all`, vous accédez aux modules suivants :
- **@oesp/sdk** : Logique cœur (agnostique) pour le packaging des données.
- **@oesp/crypto-sodium** : Fournisseur cryptographique utilisant `libsodium`.
- **@oesp/transport-ble-gatt** : Gestion du transport P2P via Bluetooth Low Energy.
- **@oesp/sync-http** : Client asynchrone pour la synchronisation avec un serveur cloud.
- **@oesp/storage-memory** : Gestionnaire de rejeu (anti-replay) en mémoire.

---

## Tutoriel Complet : De l'Identité au Transfert

### 1. Initialisation

La première étape consiste à configurer votre client avec ses dépendances (Crypto, KeyStore, Storage).

```typescript
import { 
  OESPClient, 
  createSodiumCryptoProvider, 
  MemoryReplayStore, 
  Identity 
} from '@oesp/all';

// 1. Initialiser le moteur de calcul (libsodium)
const crypto = await createSodiumCryptoProvider();

// 2. Créer un store pour éviter les attaques par rejeu
const replay = new MemoryReplayStore();

// 3. Définir un KeyStore (ici simplifié pour l'exemple)
const keystore = {
  getOrCreateIdentity: async () => ({
    ed25519Priv: new Uint8Array(64), // Votre clé privée persistée
    ed25519Pub: new Uint8Array(32),
    x25519Priv: new Uint8Array(32),
    x25519Pub: new Uint8Array(32),
  })
};

// 4. Créer le client OESP
const client = new OESPClient({ crypto, keystore, replay });

// Obtenir votre identifiant unique (DID)
const myDid = await client.getDid();
console.log(`Mon identité OESP : ${myDid}`);
```

### 2. Création du Message (Pack)

Chiffrez et signez une donnée pour un destinataire spécifique.

```typescript
const recipientDid = "did:oesp:target-device-uuid";
const data = { temperature: 22.5, status: "ok" };

// Génère un token OESP1 sécurisé (chiffré pour le destinataire, signé par vous)
const token = await client.pack(recipientDid, data);
console.log("Token généré :", token);
```

### 3. Transfert Physique (Transport BLE)

Utilisez le transport Bluetooth pour envoyer le token à un appareil à proximité, même sans internet.

```typescript
import { OESPBleGattTransport } from '@oesp/all';

// Initialiser le transport (nécessite une fonction de hashage pour les acquittements)
const transport = new OESPBleGattTransport({
  sha256: (data) => crypto.sha256(data)
});

// 'link' doit être une implémentation de l'interface BleGattLink adaptée à votre plateforme 
// (ex: Web Bluetooth, react-native-ble-plx)
await transport.sendToken(token, link);
console.log("Token envoyé via Bluetooth !");
```

### 4. Synchronisation Cloud (Async HTTP)

Si vous avez une connexion internet, vous pouvez synchroniser vos données avec un serveur central de manière asynchrone.

```typescript
import { OESPSyncClient } from '@oesp/all';

const syncClient = new OESPSyncClient({
  baseUrl: "https://api.votre-serveur-oesp.com",
  sha256: async (data) => crypto.sha256(data)
});

// Envoi asynchrone de plusieurs tokens au serveur
const result = await syncClient.syncTokens([token], myDid);

if (result.success) {
  console.log(`Synchronisation réussie. Session ID: ${result.sessionId}`);
}
```

### 5. Réception et Lecture (Unpack)

À la réception d'un token (via BLE ou Sync), vérifiez sa provenance et déchiffrez-le.

```typescript
try {
  const decoded = await client.unpack(receivedToken);
  
  console.log(`Message reçu de : ${decoded.fromDid}`);
  console.log(`Contenu :`, decoded.plaintext); // { temperature: 22.5, ... }
} catch (e) {
  console.error("Échec de la vérification ou du déchiffrement", e);
}
```

---

## Support et Documentation

Pour plus de détails sur chaque module, consultez les dossiers individuels du dépôt :
- [Cœur du SDK (@oesp/sdk)](../sdk/README.md)
- [Transport Bluetooth (@oesp/transport-ble-gatt)](../transport-ble-gatt/README.md)
- [Sync HTTP (@oesp/sync-http)](../sync-http/README.md)

Licence MIT.
