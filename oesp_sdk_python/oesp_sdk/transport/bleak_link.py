import asyncio
from typing import Callable, Optional
from bleak import BleakClient
from .link import BleGattLink
from .frames import OESP_BLE_CHAR_RX_UUID, OESP_BLE_CHAR_TX_UUID

class BleakGattLink(BleGattLink):
    def __init__(self, device_id: str):
        self.device_id = device_id
        self.client: Optional[BleakClient] = None
        self._notify_cb: Optional[Callable[[bytes], None]] = None

    async def connect(self, device_id: Optional[str] = None) -> None:
        target = device_id or self.device_id
        self.client = BleakClient(target)
        await self.client.connect()

    async def disconnect(self) -> None:
        if self.client:
            await self.client.disconnect()

    async def write_rx(self, data: bytes) -> None:
        if self.client:
            await self.client.write_gatt_char(OESP_BLE_CHAR_RX_UUID, data, response=True)

    def on_tx_notify(self, cb: Callable[[bytes], None]) -> None:
        self._notify_cb = cb

    async def start_notify(self) -> None:
        if self.client:
            def _internal_cb(char, data):
                if self._notify_cb:
                    self._notify_cb(data)
            await self.client.start_notify(OESP_BLE_CHAR_TX_UUID, _internal_cb)

    async def get_mtu_hint(self) -> Optional[int]:
        if self.client:
            return self.client.mtu_size
        return None
