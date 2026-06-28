export function decodeMsgpack(buf: Buffer): unknown {
  let pos = 0;

  function readStr(len: number): string {
    const s = buf.toString("utf-8", pos, pos + len);
    pos += len;
    return s;
  }

  function readArr(len: number): unknown[] {
    const arr: unknown[] = [];
    for (let i = 0; i < len; i++) arr.push(read());
    return arr;
  }

  function readMap(len: number): Record<string, unknown> {
    const obj: Record<string, unknown> = {};
    for (let i = 0; i < len; i++) {
      const k = String(read());
      obj[k] = read();
    }
    return obj;
  }

  function read(): unknown {
    const b = buf[pos++];
    if (b <= 0x7f) return b;
    if ((b & 0xf0) === 0x80) return readMap(b & 0x0f);
    if ((b & 0xf0) === 0x90) return readArr(b & 0x0f);
    if ((b & 0xe0) === 0xa0) return readStr(b & 0x1f);
    if (b >= 0xe0) return b - 0x100;
    switch (b) {
      case 0xc0: return null;
      case 0xc2: return false;
      case 0xc3: return true;
      case 0xca: { const v = buf.readFloatBE(pos);    pos += 4; return v; }
      case 0xcb: { const v = buf.readDoubleBE(pos);   pos += 8; return v; }
      case 0xcc: return buf[pos++];
      case 0xcd: { const v = buf.readUInt16BE(pos);   pos += 2; return v; }
      case 0xce: { const v = buf.readUInt32BE(pos);   pos += 4; return v; }
      case 0xcf: { const v = buf.readBigUInt64BE(pos); pos += 8; return Number(v); }
      case 0xd0: { const v = buf.readInt8(pos);       pos += 1; return v; }
      case 0xd1: { const v = buf.readInt16BE(pos);    pos += 2; return v; }
      case 0xd2: { const v = buf.readInt32BE(pos);    pos += 4; return v; }
      case 0xd3: { const v = buf.readBigInt64BE(pos); pos += 8; return Number(v); }
      case 0xd9: { const l = buf[pos++];                        return readStr(l); }
      case 0xda: { const l = buf.readUInt16BE(pos);  pos += 2;  return readStr(l); }
      case 0xdb: { const l = buf.readUInt32BE(pos);  pos += 4;  return readStr(l); }
      case 0xdc: { const l = buf.readUInt16BE(pos);  pos += 2;  return readArr(l); }
      case 0xdd: { const l = buf.readUInt32BE(pos);  pos += 4;  return readArr(l); }
      case 0xde: { const l = buf.readUInt16BE(pos);  pos += 2;  return readMap(l); }
      case 0xdf: { const l = buf.readUInt32BE(pos);  pos += 4;  return readMap(l); }
      default: throw new Error(`msgpack: unknown byte 0x${b.toString(16)} at offset ${pos - 1}`);
    }
  }

  return read();
}
