import sodium from 'react-native-libsodium'

export function b64urlEncode(data: Uint8Array): string {
  return sodium.to_base64(data, sodium.base64_variants.URLSAFE_NO_PADDING)
}

export function b64urlDecode(s: string): Uint8Array {
  return sodium.from_base64(s, sodium.base64_variants.URLSAFE_NO_PADDING)
}

