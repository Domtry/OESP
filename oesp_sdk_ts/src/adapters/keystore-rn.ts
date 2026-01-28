import sodium from 'react-native-libsodium'
import type { Keystore } from './keystore'

export interface KeystoreX25519 extends Keystore {
  getX25519Public(): Promise<Uint8Array>
  getX25519Private(): Promise<Uint8Array>
}

export class KeyStoreRN implements KeystoreX25519 {
  private edPriv: Uint8Array
  private edPub: Uint8Array
  private xPriv: Uint8Array
  private xPub: Uint8Array

  constructor() {
    const { privateKey, publicKey } = sodium.crypto_sign_keypair()
    this.edPriv = privateKey
    this.edPub = publicKey
    this.xPriv = sodium.randombytes_buf(32)
    this.xPub = sodium.crypto_scalarmult_base(this.xPriv)
  }

  async getPublicKey(): Promise<Uint8Array> { return this.edPub }
  async getPrivateKey(): Promise<Uint8Array> { return this.edPriv }
  async getX25519Public(): Promise<Uint8Array> { return this.xPub }
  async getX25519Private(): Promise<Uint8Array> { return this.xPriv }

  async sign(payload: Uint8Array): Promise<Uint8Array> {
    return sodium.crypto_sign_detached(payload, this.edPriv)
  }

  async encapsulate(peerPublicKey: Uint8Array): Promise<{ ek: Uint8Array, key: Uint8Array, iv: Uint8Array }> {
    const sessionKey = sodium.randombytes_buf(32)
    const ek = sodium.crypto_box_seal(sessionKey, peerPublicKey)
    const iv = sodium.randombytes_buf(12)
    return { ek, key: sessionKey, iv }
  }
}

