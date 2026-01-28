# OESP SDK (TypeScript / React Native)

TypeScript SDK for the **Offline Exchange Secure Protocol (OESP)**. Optimized for React Native using `libsodium`.

## Installation

```bash
npm install @oesp/sdk
# or
yarn add @oesp/sdk
```

Ensure you have `react-native-libsodium` installed and linked in your project.

## Usage

### Client Pack (Encryption & Signing)

```typescript
import { OESPClient, KeyStoreRN, ResolverMemory } from '@oesp/sdk';

const keystore = new KeyStoreRN();
const resolver = new ResolverMemory();
const client = new OESPClient(keystore, undefined, resolver);

// Resolve recipient public key
const recipientDid = "oesp:did:...";
resolver.add(recipientDid, recipientX25519PublicKey);

const token = await client.pack(recipientDid, { hello: "world" });
console.log("Token:", token);
```

### Client Unpack (Decryption & Verification)

```typescript
const decoded = await client.unpack(token);
console.log("Decoded body:", decoded.plaintext);
```

## Features

- **End-to-End Encryption**: X25519 Key Exchange + ChaCha20-Poly1305.
- **Identity & Integrity**: Ed25519 signatures linked to DIDs.
- **Anti-Replay**: Built-in support for `mid` (Message ID) tracking.
- **Offline First**: Designed to exchange secure tokens without a persistent connection.

## Security

This SDK relies on `react-native-libsodium` for all cryptographic operations. Private keys never leave the `Keystore` implementation.
