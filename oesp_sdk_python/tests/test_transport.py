import unittest
from oesp_sdk.transport import OESPBleGattTransport, BleGattLink

class MockLink(BleGattLink):
    async def connect(self, device_id: str) -> None: pass
    async def disconnect(self) -> None: pass
    async def write_rx(self, data: bytes) -> None: pass
    def on_tx_notify(self, cb) -> None: pass
    async def start_notify(self) -> None: pass
    async def get_mtu_hint(self) -> int: return 185

class TestTransport(unittest.IsolatedAsyncioTestCase):
    async def test_transport_init(self):
        transport = OESPBleGattTransport()
        self.assertEqual(transport.max_chunk_bytes, 1024)

if __name__ == '__main__':
    unittest.main()
