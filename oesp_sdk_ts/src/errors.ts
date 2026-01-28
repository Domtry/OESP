import { ErrorCode } from './types'

export class OESPError extends Error {
  readonly code: ErrorCode
  readonly detail?: string
  constructor(code: ErrorCode, message: string, detail?: string) {
    super(message)
    this.code = code
    this.detail = detail
  }
}

export class InvalidSignatureError extends OESPError {
  constructor(detail?: string) { super(ErrorCode.INVALID_SIGNATURE, 'Invalid signature', detail) }
}
export class ExpiredError extends OESPError {
  constructor(detail?: string) { super(ErrorCode.EXPIRED, 'Envelope expired', detail) }
}
export class ReplayError extends OESPError {
  constructor(detail?: string) { super(ErrorCode.REPLAY, 'Replay detected', detail) }
}
export class InvalidFormatError extends OESPError {
  constructor(detail?: string) { super(ErrorCode.INVALID_FORMAT, 'Invalid envelope format', detail) }
}
export class UnsupportedAlgError extends OESPError {
  constructor(detail?: string) { super(ErrorCode.UNSUPPORTED_ALG, 'Unsupported algorithm', detail) }
}
export class DecryptionFailedError extends OESPError {
  constructor(detail?: string) { super(ErrorCode.DECRYPTION_FAILED, 'Decryption failed', detail) }
}
export class KexFailedError extends OESPError {
  constructor(detail?: string) { super(ErrorCode.KEX_FAILED, 'Key exchange failed', detail) }
}
export class StorageError extends OESPError {
  constructor(detail?: string) { super(ErrorCode.STORAGE_ERROR, 'Storage error', detail) }
}
export class ResolveFailedError extends OESPError {
  constructor(detail?: string) { super(ErrorCode.RESOLVE_FAILED, 'Resolver failure', detail) }
}
export class InvalidDIDError extends OESPError {
  constructor(detail?: string) { super(ErrorCode.INVALID_DID, 'Invalid DID', detail) }
}

