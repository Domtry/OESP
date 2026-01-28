export function b64urlEncode(bytes: Uint8Array): string {
  const base64 = base64Encode(bytes);
  return base64.replace(/=/g, '').replace(/\+/g, '-').replace(/\//g, '_');
}

export function b64urlDecode(s: string): Uint8Array {
  const pad = s.length % 4 === 0 ? '' : '='.repeat(4 - (s.length % 4));
  const base64 = s.replace(/-/g, '+').replace(/_/g, '/') + pad;
  return base64Decode(base64);
}

export function canonicalJsonBytes(obj: unknown): Uint8Array {
  const json = canonicalStringify(obj);
  return new TextEncoder().encode(json);
}

function canonicalStringify(obj: unknown): string {
  if (obj === null || typeof obj !== 'object') {
    return JSON.stringify(obj);
  }
  if (Array.isArray(obj)) {
    const arr = obj.map((v) => JSON.parse(canonicalStringify(v)));
    return JSON.stringify(arr);
  }
  const entries = Object.entries(obj as Record<string, unknown>).sort(([a], [b]) => (a < b ? -1 : a > b ? 1 : 0));
  const out: Record<string, unknown> = {};
  for (const [k, v] of entries) {
    out[k] = JSON.parse(canonicalStringify(v));
  }
  return JSON.stringify(out);
}

export function deriveDidWithSha(ed25519Pub: Uint8Array, sha256: (bytes: Uint8Array) => Uint8Array): string {
  const sha = sha256(ed25519Pub);
  const b32 = base32encode(sha).toLowerCase().replace(/=+$/g, '');
  return `oesp:did:${b32}`;
}

function base32encode(bytes: Uint8Array): string {
  const alphabet = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ234567';
  let bits = 0;
  let value = 0;
  let output = '';
  for (const byte of bytes) {
    value = (value << 8) | byte;
    bits += 8;
    while (bits >= 5) {
      output += alphabet[(value >>> (bits - 5)) & 31];
      bits -= 5;
    }
  }
  if (bits > 0) {
    output += alphabet[(value << (5 - bits)) & 31];
  }
  // pad with '=' to multiple of 8 chars (we'll strip later)
  while (output.length % 8 !== 0) output += '=';
  return output;
}

const base64Alphabet = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/';

function base64Encode(bytes: Uint8Array): string {
  let output = '';
  let i = 0;
  while (i < bytes.length) {
    const a = bytes[i++] ?? 0;
    const b = bytes[i++] ?? 0;
    const c = bytes[i++] ?? 0;
    const triplet = (a << 16) | (b << 8) | c;
    output += base64Alphabet[(triplet >> 18) & 63];
    output += base64Alphabet[(triplet >> 12) & 63];
    output += i - 2 < bytes.length ? base64Alphabet[(triplet >> 6) & 63] : '=';
    output += i - 1 < bytes.length ? base64Alphabet[triplet & 63] : '=';
  }
  return output;
}

function base64Decode(s: string): Uint8Array {
  // Remove whitespace
  s = s.replace(/\s/g, '');
  const len = s.length;
  if (len % 4 !== 0) throw new Error('Invalid base64');
  const output: number[] = [];
  let i = 0;
  while (i < len) {
    const a = base64Alphabet.indexOf(s[i++]);
    const b = base64Alphabet.indexOf(s[i++]);
    const c = base64Alphabet.indexOf(s[i++]);
    const d = base64Alphabet.indexOf(s[i++]);
    const triplet = (a << 18) | (b << 12) | ((c & 63) << 6) | (d & 63);
    output.push((triplet >> 16) & 255);
    if (s[i - 2] !== '=') output.push((triplet >> 8) & 255);
    if (s[i - 1] !== '=') output.push(triplet & 255);
  }
  return new Uint8Array(output);
}
