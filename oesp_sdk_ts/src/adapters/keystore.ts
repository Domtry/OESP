export interface Keystore {
  getPublicKey(): Promise<Uint8Array>
  getPrivateKey(): Promise<Uint8Array>
  sign(payload: Uint8Array): Promise<Uint8Array>
  encapsulate(peerPublicKey: Uint8Array): Promise<{ ek: Uint8Array, key: Uint8Array, iv: Uint8Array }>
}

