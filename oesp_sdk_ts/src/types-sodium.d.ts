declare module 'react-native-libsodium' {
  const sodium: {
    randombytes_buf: (len: number) => Uint8Array
    crypto_sign_keypair: () => { publicKey: Uint8Array, privateKey: Uint8Array }
    crypto_sign_seed_keypair: (seed: Uint8Array) => { publicKey: Uint8Array, privateKey: Uint8Array }
    crypto_sign_detached: (message: Uint8Array, privateKey: Uint8Array) => Uint8Array
    crypto_sign_verify_detached: (sig: Uint8Array, message: Uint8Array, publicKey: Uint8Array) => boolean
    crypto_box_seal: (message: Uint8Array, recipientPublicKey: Uint8Array) => Uint8Array
    crypto_box_seal_open: (ciphertext: Uint8Array, publicKey: Uint8Array, privateKey: Uint8Array) => Uint8Array
    crypto_scalarmult_base: (secretKey: Uint8Array) => Uint8Array
    crypto_aead_chacha20poly1305_ietf_encrypt: (message: Uint8Array, aad: Uint8Array|null, nsec: null, nonce: Uint8Array, key: Uint8Array) => Uint8Array
    crypto_aead_chacha20poly1305_ietf_decrypt: (ciphertext: Uint8Array, aad: Uint8Array|null, nsec: null, nonce: Uint8Array, key: Uint8Array) => Uint8Array
    crypto_hash_sha256: (message: Uint8Array) => Uint8Array
    to_base64: (data: Uint8Array, variant: number) => string
    from_base64: (s: string, variant: number) => Uint8Array
    base64_variants: { URLSAFE_NO_PADDING: number }
  }
  export default sodium
}
