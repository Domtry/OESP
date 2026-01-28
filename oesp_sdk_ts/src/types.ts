export type From = {
  did: string
  pub: string
}

export type To = {
  did: string
}

export type EnvelopeV1 = {
  v: 1
  typ: string
  mid: string
  sid: string
  ts: number
  exp: number
  from: From
  to: To
  enc: string
  kex: string
  ek: string
  iv: string
  ct: string
  tag?: string
  sig_alg: string
  sig: string
}

export type DecodedMessage = {
  mid: string
  sid: string
  ts: number
  exp: number
  from_did: string
  to_did: string
  plaintext: Uint8Array
}

export type VerifiedEnvelope = {
  envelope: EnvelopeV1
  verified: boolean
  signer_did: string
}

export enum ErrorCode {
  INVALID_SIGNATURE = "INVALID_SIGNATURE",
  EXPIRED = "EXPIRED",
  REPLAY = "REPLAY",
  INVALID_FORMAT = "INVALID_FORMAT",
  UNSUPPORTED_ALG = "UNSUPPORTED_ALG",
  DECRYPTION_FAILED = "DECRYPTION_FAILED",
  KEX_FAILED = "KEX_FAILED",
  STORAGE_ERROR = "STORAGE_ERROR",
  RESOLVE_FAILED = "RESOLVE_FAILED",
  INVALID_DID = "INVALID_DID"
}

