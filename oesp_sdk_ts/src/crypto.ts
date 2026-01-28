import sodium from 'react-native-libsodium'

export function generateIdentityKeypair(): { privateKey: Uint8Array, publicKey: Uint8Array } {
  const { privateKey, publicKey } = sodium.crypto_sign_keypair()
  return { privateKey, publicKey }
}

export function signEd25519(payload: Uint8Array, privateKey: Uint8Array): Uint8Array {
  return sodium.crypto_sign_detached(payload, privateKey)
}

export function verifyEd25519(payload: Uint8Array, signature: Uint8Array, publicKey: Uint8Array): boolean {
  return sodium.crypto_sign_verify_detached(signature, payload, publicKey)
}

export function sealSessionKeyX25519(recipientPublicKey: Uint8Array, sessionKey: Uint8Array): Uint8Array {
  return sodium.crypto_box_seal(sessionKey, recipientPublicKey)
}

export function openSealedSessionKeyX25519(recipientPrivateKey: Uint8Array, ek: Uint8Array): Uint8Array {
  const recipientPublicKey = sodium.crypto_scalarmult_base(recipientPrivateKey)
  return sodium.crypto_box_seal_open(ek, recipientPublicKey, recipientPrivateKey)
}

export function aeadEncrypt(sessionKey: Uint8Array, plaintext: Uint8Array, aad: Uint8Array): { iv: Uint8Array, ct: Uint8Array } {
  if (sessionKey.length !== 32) throw new Error('sessionKey must be 32 bytes')
  const iv = sodium.randombytes_buf(12)
  const ct = sodium.crypto_aead_chacha20poly1305_ietf_encrypt(plaintext, aad, null, iv, sessionKey)
  return { iv, ct }
}

export function aeadDecrypt(sessionKey: Uint8Array, iv: Uint8Array, ct: Uint8Array, aad: Uint8Array): Uint8Array {
  if (sessionKey.length !== 32) throw new Error('sessionKey must be 32 bytes')
  return sodium.crypto_aead_chacha20poly1305_ietf_decrypt(ct, aad, null, iv, sessionKey)
}
