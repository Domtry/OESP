# @oesp/transport-ble-gatt

Transport OESP via BLE GATT (Central <-> Peripheral) avec support asynchrone et fragmentation.

## Installation

```bash
npm install @oesp/transport-ble-gatt
```

## Fonctionnalités

- **Communication P2P Offline** : Échange de données sans internet.
- **Fragmentation Automatique** : Gestion transparente du MTU BLE.
- **Protocole Stop-and-Wait** : Fiabilité accrue via acquittements (ACK).
- **Opérations Asynchrones** : Utilisation de `Promise` pour toutes les opérations I/O.
- **Crypto Agnostique** : Injection de la fonction de hachage SHA-256 pour compatibilité multi-plateforme (Node.js, React Native, Browser).

## Utilisation (Central)

Le mode Central est généralement utilisé par l'application mobile qui scanne et se connecte au périphérique.

```ts
import { OESPBleGattTransport } from '@oesp/transport-ble-gatt';
import { MyBleLink } from './MyBleLink'; // Votre implémentation de BleGattLink
import { sha256 } from 'js-sha256'; // Ou autre provider

// 1. Initialiser le transport avec le provider SHA-256
const transport = new OESPBleGattTransport({
  sha256: async (data) => new Uint8Array(sha256.arrayBuffer(data))
});

const link = new MyBleLink();

try {
  // 2. Connexion (géré par votre implémentation Link)
  await link.connect('DEVICE_UUID');

  // 3. Envoi d'un token OESP de manière asynchrone
  // La méthode gère la fragmentation et les ACK automatiquement
  await transport.sendToken(oespTokenBytes, link);
  console.log("Token envoyé avec succès !");

} catch (err) {
  console.error("Erreur de transport:", err);
}
```

## Utilisation (Peripheral)

Le mode Peripheral est utilisé par l'appareil IoT ou le receveur.

```ts
const transport = new OESPBleGattTransport({
  sha256: async (data) => new Uint8Array(sha256.arrayBuffer(data))
});
const link = new MyBleLink(); // Implémentation côté périphérique

// Boucle de réception asynchrone
transport.receiveLoop(link, async (token) => {
  console.log("Token OESP complet reçu:", token);
  // Traitement du token...
});
```

## Interface `BleGattLink`

Vous devez fournir une implémentation de l'interface `BleGattLink` adaptée à votre environnement (ex: `react-native-ble-plx` ou `noble`).

```ts
interface BleGattLink {
  // MTU négocié (doit être > 23 pour de meilleures performances)
  mtu: number;
  
  // Écrit des données sur la caractéristique RX du pair
  write(data: Uint8Array): Promise<void>;
  
  // Lit des données depuis la caractéristique TX du pair
  read(): Promise<Uint8Array>;
  
  // Ferme la connexion
  close(): Promise<void>;
}
```

## Notes Techniques

- **MTU & Fragmentation** : Le transport découpe les messages OESP (souvent > MTU) en trames. Assurez-vous que `link.mtu` reflète le MTU réel négocié.
- **Timeout** : Un timeout est appliqué si un ACK n'est pas reçu à temps.
- **Android** : Nécessite les permissions `BLUETOOTH_SCAN` et `BLUETOOTH_CONNECT`.
