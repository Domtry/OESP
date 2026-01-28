React Native demo (pack/unpack)

Pseudo-code:

```tsx
import { OESPClient } from '@oesp/sdk'
import { MemoryReplayStore } from '@oesp/storage-memory'
import { CryptoProviderRN } from '@oesp/crypto-react-native'
import { RNKeyStore } from '@oesp/keystore-react-native'

export default function App() {
  const [out, setOut] = useState('')
  useEffect(() => {
    (async () => {
      const crypto = new CryptoProviderRN()
      const keystore = new RNKeyStore()
      const replay = new MemoryReplayStore()
      const client = new OESPClient({ crypto, keystore, replay })
      const did = await client.getDid()
      const token = await client.pack(did, { hello: 'rn' })
      const v = await client.verify(token)
      const d = await client.unpack(token)
      setOut(JSON.stringify({ did, token, verified: v.verified, plaintext: new TextDecoder().decode(d.plaintext) }))
    })()
  }, [])
  return <Text>{out}</Text>
}
```

