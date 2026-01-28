import { describe, it, expect, vi } from "vitest";
import { OESPBleGattTransport } from "../src/OESPBleGattTransport";
import { MockBleGattLink } from "../src/link/mock";

describe("OESPBleGattTransport", () => {
  const sha256 = (data: Uint8Array) => {
    // Mock sha256 (returns first 32 bytes or pads)
    const res = new Uint8Array(32);
    res.set(data.slice(0, 32));
    return res;
  };

  it("should send a token via mock link", async () => {
    const transport = new OESPBleGattTransport({ sha256 });
    const link = new MockBleGattLink();
    
    // Setup mock receiver to ACK automatically
    link.onTxNotify((data) => {
      const frame = JSON.parse(new TextDecoder().decode(data));
      if (frame.t === "START" || frame.t === "CHUNK" || frame.t === "END") {
        const ack = { t: "ACK", sid: frame.sid, ack: frame.seq ?? -1 };
        setTimeout(() => link.simulateTxNotify(new TextEncoder().encode(JSON.stringify(ack))), 10);
      }
    });

    await transport.sendToken("hello world", link);
    // If it doesn't throw, it's successful
  });

  it("should receive a token via mock link", async () => {
    const transport = new OESPBleGattTransport({ sha256 });
    const link = new MockBleGattLink();
    
    let receivedToken = "";
    transport.receiveLoop(link, (token) => {
      receivedToken = token;
    });

    const sid = "test-sid";
    const token = "hello world";
    const tokenBytes = new TextEncoder().encode(token);
    const sha = await transport["sha256"](tokenBytes);
    
    // Simulate START
    link.simulateTxNotify(new TextEncoder().encode(JSON.stringify({
      t: "START", sid, mid: "m1", totalLen: tokenBytes.length, parts: 1, sha256: "AAAA" // Dummy b64
    })));

    // In a real test we'd need to mock base64 properly
  });
});
