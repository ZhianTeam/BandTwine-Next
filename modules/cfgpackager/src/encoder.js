/*
 * File: src/encoder.js
 * Revision number: 1
 * License: GPL-3.0
 * Copyleft (c) 2025-2026 ZhianTeam. All rights may not reserved.
 *
 * This is the converter for BandTwine Next to squash original KDL configuration file to a minimized binary format.
 * BandTwine is a FLOSS Software distributed under AGPL-3.0 license. This software comes with ABSOLUTELY NO WARRANTY.
 * You are welcome to redistribute it under certain conditions. See the GNU Affero General Public License for more details.
 */

import { crc32 } from './crc32.js';

// Magic Header
const MAGIC = Buffer.from([0x42, 0x54, 0x4E, 0x43]); // ASCII: 'BT  N  C'

// Version Definition
const FORMAT_VERSION = 1;

const TYPE = {
  NULL: 0x00,    // null
  BOOL: 0x01,    // boolean
  INT32: 0x02,   // int32
  FLOAT64: 0x03, // float64.2f
  STRING: 0x04,  // UTF-8 string
  ARRAY: 0x10,
  OBJECT: 0x11   // KV Pair
};

const SECTION = {
  META: 0x01,
  ENV: 0x02,
  PROPERTIES: 0x03
};

const enc = new TextEncoder();

class BinaryWriter {
  constructor() {
    this.chunks = [];
    this.length = 0;
  }

  _push(buf) {
    this.chunks.push(buf);
    this.length += buf.length;
  }

  writeUInt8(v) {
    const b = Buffer.allocUnsafe(1);
    b.writeUInt8(v & 0xFF, 0);
    this._push(b);
  }

  writeUInt16BE(v) {
    const b = Buffer.allocUnsafe(2);
    b.writeUInt16BE(v & 0xFFFF, 0);
    this._push(b);
  }

  writeInt32BE(v) {
    const b = Buffer.allocUnsafe(4);
    b.writeInt32BE(v | 0, 0);
    this._push(b);
  }

  writeUInt32BE(v) {
    const b = Buffer.allocUnsafe(4);
    b.writeUInt32BE(v >>> 0, 0);
    this._push(b);
  }

  writeDoubleBE(v) {
    const b = Buffer.allocUnsafe(8);
    b.writeDoubleBE(v, 0);
    this._push(b);
  }

  writeBytes(buf) {
    this._push(Buffer.from(buf));
  }

  // chunk2buffer
  toBuffer() {
    return Buffer.concat(this.chunks, this.length);
  }
}

// JS2Binary
function encodeValue(w, value) {
  if (value === null || value === undefined) {
    w.writeUInt8(TYPE.NULL);
    return;
  }

  if (typeof value === 'boolean') {
    w.writeUInt8(TYPE.BOOL);
    w.writeUInt8(value ? 0x01 : 0x00);
    return;
  }

  if (typeof value === 'number') {
    if (Number.isInteger(value) && value >= -2147483648 && value <= 2147483647) {
      w.writeUInt8(TYPE.INT32);
      w.writeInt32BE(value);} else {
      w.writeUInt8(TYPE.FLOAT64);
      w.writeDoubleBE(value);
    }
    return;
  }

  if (typeof value === 'string') {
    const bytes = Buffer.from(enc.encode(value));
    if (bytes.length > 65535) {
      throw new RangeError(`String too long to encode (${bytes.length} bytes, max 65535)`);
    }
    w.writeUInt8(TYPE.STRING);
    w.writeUInt16BE(bytes.length);
    w.writeBytes(bytes);
    return;
  }

  if (Array.isArray(value)) {
    if (value.length > 65535) {
      throw new RangeError(`Array too large (${value.length} elements, max 65535)`);
    }
    w.writeUInt8(TYPE.ARRAY);
    w.writeUInt16BE(value.length);
    for (const item of value) {
      encodeValue(w, item);
    }
    return;
  }

  if (typeof value === 'object') {
    const keys = Object.keys(value);
    if (keys.length > 65535) {
      throw new RangeError(`Object too large (${keys.length} keys, max 65535)`);
    }
    w.writeUInt8(TYPE.OBJECT);
    w.writeUInt16BE(keys.length);
    for (const key of keys) {
      encodeValue(w, key);        // 键作为 STRING 编码
      encodeValue(w, value[key]); // 值递归编码
    }
    return;
  }

  throw new TypeError(`Cannot encode value of type ${typeof value}`);
}

// Encode to Binary
// [1B section_id][4B payload_length][...payload]
function encodeSection(sectionId, value) {
  const payloadWriter = new BinaryWriter();
  encodeValue(payloadWriter, value);
  const payload = payloadWriter.toBuffer();

  const header = Buffer.allocUnsafe(5);
  header.writeUInt8(sectionId, 0);
  header.writeUInt32BE(payload.length, 1);

  return Buffer.concat([header, payload]);
}

export function encode(data) {
  const sections = [];

  sections.push(encodeSection(SECTION.META, data.meta));
  sections.push(encodeSection(SECTION.ENV, data.env));
  sections.push(encodeSection(SECTION.PROPERTIES, data.properties));

  const body = Buffer.concat(sections);

  // Generate Header
  const headerWithoutCRC = Buffer.allocUnsafe(11); // 4+2+1+4MAGIC.copy(headerWithoutCRC, 0);
  headerWithoutCRC.writeUInt16BE(FORMAT_VERSION, 4);
  headerWithoutCRC.writeUInt8(sections.length, 6);
  headerWithoutCRC.writeUInt32BE(body.length, 7);

  // CRC Overwrite
  // [headerWithoutCRC + body]
  const dataForChecksum = Buffer.concat([headerWithoutCRC, body]);
  const checksum = crc32(dataForChecksum);

  const crcBuf = Buffer.allocUnsafe(4);
  crcBuf.writeUInt32BE(checksum, 0);

  return Buffer.concat([headerWithoutCRC, crcBuf, body]);
}
