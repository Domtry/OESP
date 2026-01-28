import { OESPClient } from '@oesp/sdk';
import { createSodiumCryptoProvider } from '@oesp/crypto-sodium';
import { NodeFileKeyStore } from '@oesp/keystore-node';
import { MemoryReplayStore } from '@oesp/storage-memory';

async function main() {
  const crypto = await createSodiumCryptoProvider();
  const keystore = new NodeFileKeyStore('.data/identity.json');
  const replay = new MemoryReplayStore();
  const client = new OESPClient({ crypto, keystore, replay });
  const did = await client.getDid();
  console.log('DID:', did);
  const token = await client.pack(did, { hello: 'world' });
  console.log('token:', token);
  const v = await client.verify(token);
  console.log('verified:', v);
  const d = await client.unpack(token);
  console.log('plaintext:', new TextDecoder().decode(d.plaintext));
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
