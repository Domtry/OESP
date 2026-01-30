import { CryptoProvider, KeyStore, ReplayStore, DecodedMessage, VerifiedEnvelope, Identity } from './types';
import { b64urlEncode, b64urlDecode, canonicalJsonBytes, deriveDidWithSha } from './utils';

export interface OESPClientDeps {
  crypto: CryptoProvider;
  keystore: KeyStore;
  replay: ReplayStore;
}

export class OESPClient {
  private deps: OESPClientDeps;
  private identity?: Identity;
  constructor(deps: OESPClientDeps) {
    this.deps = deps;
  }

  async getDid(): Promise<string> {
    const id = await this.ensureIdentity();
    return deriveDidWithSha(id.ed25519Pub, this.deps.crypto.sha256);
  }

  async pack(toDid: string, body: object | Uint8Array, opts?: { ttlSec?: number }): Promise<string> {
    const { crypto } = this.deps;
    const ttlSec = opts?.ttlSec ?? 600;
    const now = Math.floor(Date.now() / 1000);
    const exp = now + ttlSec;
    const mid = b64urlEncode(crypto.randomBytes(12));
    const id = await this.ensureIdentity();
    const sid = deriveDidWithSha(id.ed25519Pub, crypto.sha256);
    const edPubB64 = b64urlEncode(id.ed25519Pub);
    const sessionKey = crypto.randomBytes(32);
    const sealed = crypto.x25519Seal(id.x25519Pub, sessionKey);

    const env: Record<string, unknown> = {
      v: 1,
      typ: 'oesp.envelope',
      mid,
      sid,
      ts: now,
      exp,
      from: { did: sid, pub: edPubB64 },
      to: { did: toDid },
      enc: 'CHACHA20-POLY1305',
      kex: 'X25519',
      ek: b64urlEncode(sealed),
      iv: '',
      ct: '',
      sig_alg: 'Ed25519',
      sig: ''
    };

    const aad = canonicalJsonBytes(envFiltered(env, ['ct', 'sig', 'iv']));
    const bodyBytes = body instanceof Uint8Array ? body : canonicalJsonBytes(body);
    const { iv, ct, tag } = crypto.aeadEncrypt(sessionKey, bodyBytes, aad);
    env.iv = b64urlEncode(iv);
    env.ct = b64urlEncode(ct);
    if (tag) env['tag'] = b64urlEncode(tag);

    const toSignBase = canonicalJsonBytes(envFiltered(env, ['sig']));
    const dataToSign = concatBytes(toSignBase, b64urlDecode(String(env.ct)));
    const sig = crypto.ed25519Sign(id.ed25519Priv, dataToSign);
    env.sig = b64urlEncode(sig);

    const tokenPayload = canonicalJsonBytes(env);
    return `OESP1.${b64urlEncode(tokenPayload)}`;
  }

  async verify(token: string, opts?: { now?: number; allowExpired?: boolean }): Promise<VerifiedEnvelope> {
    const env = parseToken(token);
    const now = opts?.now ?? Math.floor(Date.now() / 1000);
    const { crypto } = this.deps;

    if (!opts?.allowExpired && env.exp < now) {
      throw new Error('ExpiredError');
    }

    // DID match
    const pubBytes = b64urlDecode(env.from.pub);
    const derived = deriveDidWithSha(pubBytes, crypto.sha256);
    if (derived !== env.from.did) throw new Error('InvalidDIDError');

    // Signature check: canonical(envelope without sig) + ct
    const envDict = envToDict(env);
    const toSignBase = canonicalJsonBytes(excludeKeys(envDict, ['sig']));
    const ctBytes = b64urlDecode(env.ct);
    const dataToSign = concatBytes(toSignBase, ctBytes);
    const sigBytes = b64urlDecode(env.sig);
    const ok = crypto.ed25519Verify(pubBytes, dataToSign, sigBytes);
    if (!ok) throw new Error('InvalidSignatureError');

    const id = await this.ensureIdentity();
    const seen = await this.deps.replay.seen(env.sid, env.mid);
    if (seen) throw new Error('ReplayError');
    await this.deps.replay.markSeen(env.sid, env.mid);

    return { envelope: envDict, verified: true, signerDid: env.from.did };
  }

  async unpack(token: string, opts?: { now?: number; allowExpired?: boolean }): Promise<DecodedMessage> {
    const env = parseToken(token);
    await this.verify(token, opts);
    const id = await this.ensureIdentity();

    const ivBytes = b64urlDecode(env.iv);
    const ctBytes = b64urlDecode(env.ct);
    const ekBytes = b64urlDecode(env.ek);

    const sessionKey = this.deps.crypto.x25519Open(id.x25519Priv, ekBytes);
    const aad = canonicalJsonBytes(envFiltered(envToDict(env), ['ct', 'sig', 'iv']));
    const plaintext = this.deps.crypto.aeadDecrypt(sessionKey, ivBytes, ctBytes, aad, env.tag ? b64urlDecode(env.tag) : undefined);

    return {
      mid: env.mid,
      sid: env.sid,
      ts: env.ts,
      exp: env.exp,
      fromDid: env.from.did,
      toDid: env.to.did,
      plaintext
    };
  }

  private async ensureIdentity(): Promise<Identity> {
    if (!this.identity) this.identity = await this.deps.keystore.getOrCreateIdentity();
    return this.identity!;
  }
}

// Envelope types (structural)
type EnvelopeV1 = {
  v: 1;
  typ: string;
  mid: string;
  sid: string;
  ts: number;
  exp: number;
  from: { did: string; pub: string };
  to: { did: string };
  enc: string;
  kex: string;
  ek: string;
  iv: string;
  ct: string;
  tag?: string;
  sig_alg: string;
  sig: string;
};

function parseToken(token: string): EnvelopeV1 {
  if (!token.startsWith('OESP1.')) throw new Error('InvalidFormatError');
  const payloadB64 = token.slice('OESP1.'.length);
  const jsonBytes = b64urlDecode(payloadB64);
  const json = new TextDecoder().decode(jsonBytes);
  const d = JSON.parse(json);
  return d as EnvelopeV1;
}

function envFiltered(env: Record<string, unknown> | EnvelopeV1, excludeKeys: string[]): Record<string, unknown> {
  const e = envToDict(env);
  for (const k of excludeKeys) delete e[k];
  return e;
}

function envToDict(env: Record<string, unknown> | EnvelopeV1): Record<string, unknown> {
  const d: Record<string, unknown> = {
    v: env.v,
    typ: env.typ,
    mid: env.mid,
    sid: env.sid,
    ts: env.ts,
    exp: env.exp,
    from: env.from,
    to: env.to,
    enc: env.enc,
    kex: env.kex,
    ek: env.ek,
    iv: env.iv,
    ct: env.ct,
    sig_alg: env.sig_alg,
    sig: env.sig
  } as Record<string, unknown>;
  if ((env as EnvelopeV1).tag) d['tag'] = (env as EnvelopeV1).tag;
  return d;
}

function excludeKeys(obj: Record<string, unknown>, keys: string[]): Record<string, unknown> {
  const out: Record<string, unknown> = { ...obj };
  for (const k of keys) delete out[k];
  return out;
}

function concatBytes(a: Uint8Array, b: Uint8Array): Uint8Array {
  const out = new Uint8Array(a.length + b.length);
  out.set(a, 0);
  out.set(b, a.length);
  return out;
}

export * from './types';
export { base64Encode, base64Decode, b64urlEncode, b64urlDecode, canonicalJsonBytes } from './utils';
