# @oesp/transport-ble-gatt

Transport OESP via BLE GATT (Central <-> Peripheral).

## Installation

```bash
npm install @oesp/transport-ble-gatt
```

## Utilisation (Central)

```ts
import { OESPBleGattTransport } from '@oesp/transport-ble-gatt';
import { MyBleLink } from './MyBleLink'; // Implémente BleGattLink

const transport = new OESPBleGattTransport();
const link = new MyBleLink();

await link.connect('DEVICE_ID');
await transport.sendToken(oespToken, link);
```

## Utilisation (Peripheral)

```ts
const transport = new OESPBleGattTransport();
const link = new MyBleLink();

transport.receiveLoop(link, (token) => {
  console.log("Token OESP reçu:", token);
});
```

## Notes de compatibilité

- **Android** : Nécessite les permissions `BLUETOOTH_SCAN` et `BLUETOOTH_CONNECT`. MTU par défaut souvent à 23, `getMtuHint()` recommandé.
- **iOS** : MTU géré automatiquement par l'OS.
- **Web Bluetooth** : Support limité aux navigateurs basés sur Chromium.
