import sodium from 'react-native-libsodium'

const DID_PREFIX = 'oesp:did:'

export function deriveDid(pubkeyBytes: Uint8Array): string {
  const digest = sodium.crypto_hash_sha256(pubkeyBytes)
  const b32 = base32EncodeRfc4648(digest).toLowerCase()
  return DID_PREFIX + b32
}

function base32EncodeRfc4648(data: Uint8Array): string {
  const alphabet = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ234567'
  let bits = 0
  let value = 0
  let output = ''
  for (let i = 0; i < data.length; i++) {
    value = (value << 8) | data[i]
    bits += 8
    while (bits >= 5) {
      output += alphabet[(value >>> (bits - 5)) & 31]
      bits -= 5
    }
  }
  if (bits > 0) {
    output += alphabet[(value << (5 - bits)) & 31]
  }
  return output // no padding
}

