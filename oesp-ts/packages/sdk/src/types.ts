export interface CryptoProvider {
  sha256(bytes: Uint8Array): Uint8Array;
  ed25519Sign(priv: Uint8Array, data: Uint8Array): Uint8Array;
  ed25519Verify(pub: Uint8Array, data: Uint8Array, sig: Uint8Array): boolean;
  x25519Seal(recipientPub: Uint8Array, sessionKey: Uint8Array): Uint8Array;
  x25519Open(recipientPriv: Uint8Array, sealed: Uint8Array): Uint8Array;
  aeadEncrypt(key: Uint8Array, plaintext: Uint8Array, aad: Uint8Array): { iv: Uint8Array; ct: Uint8Array; tag?: Uint8Array };
  aeadDecrypt(key: Uint8Array, iv: Uint8Array, ct: Uint8Array, aad: Uint8Array, tag?: Uint8Array): Uint8Array;
  randomBytes(n: number): Uint8Array;
}

export interface Identity {
  ed25519Priv: Uint8Array;
  ed25519Pub: Uint8Array;
  x25519Priv: Uint8Array;
  x25519Pub: Uint8Array;
}

export interface KeyStore {
  getOrCreateIdentity(): Promise<Identity>;
}

export interface ReplayStore {
  seen(fromDid: string, mid: string): Promise<boolean>;
  markSeen(fromDid: string, mid: string): Promise<void>;
}

export interface DecodedMessage {
  mid: string;
  sid: string;
  ts: number;
  exp: number;
  fromDid: string;
  toDid: string;
  plaintext: Uint8Array;
}

export interface VerifiedEnvelope {
  envelope: Record<string, unknown>;
  verified: boolean;
  signerDid: string;
}
