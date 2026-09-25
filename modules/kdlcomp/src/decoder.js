/*
  File: kdlcomp/src/decoder.js
  Revision number: 1
  License: GPL-3.0
  Copyleft (c) 2025-2026 ZhianTeam. All rights may not reserved.

  This is the decoder for BandTwine Next BTNC binary format.
  BandTwine is a FLOSS Software distributed under AGPL-3.0 license. This software comes with ABSOLUTELY NO WARRANTY.
  You are welcome to redistribute it under certain conditions. See the GNU Affero General Public License for more details.
*/

import { crc32 } from './crc32.js';

const MAGIC = Buffer.from([0x42, 0x54, 0x4E, 0x43]); // "BTNC"

const TYPE = {
	NULL: 0x00,
	BOOL: 0x01,
	INT32: 0x02,
	FLOAT64: 0x03,
	STRING: 0x04,
	ARRAY: 0x10,
	OBJECT: 0x11
};

const SECTION = {
	META: 0x01,
	ENV: 0x02,
	PROPERTIES: 0x03
};

class BinaryReader {
	constructor(buf) {
		this.buffer = buf;
		this.offset = 0;
	}

	readUInt8() {
		const v = this.buffer.readUInt8(this.offset);
		this.offset += 1;
		return v;
	}

	readUInt16BE() {
		const v = this.buffer.readUInt16BE(this.offset);
		this.offset += 2;
		return v;
	}

	readInt32BE() {
		const v = this.buffer.readInt32BE(this.offset);
		this.offset += 4;
		return v;
	}

	readUInt32BE() {
		const v = this.buffer.readUInt32BE(this.offset);
		this.offset += 4;
		return v;
	}

	readDoubleBE() {
		const v = this.buffer.readDoubleBE(this.offset);
		this.offset += 8;
		return v;
	}

	readBytes(length) {
		const buf = this.buffer.slice(this.offset, this.offset + length);
		this.offset += length;
		return buf;
	}

	skip(bytes) {
		this.offset += bytes;
	}

	hasMore() {
		return this.offset < this.buffer.length;
	}
}

function decodeValue(r) {
	const type = r.readUInt8();

	if (type === TYPE.NULL) {
		return null;
	}

	if (type === TYPE.BOOL) {
		return r.readUInt8() === 0x01;
	}

	if (type === TYPE.INT32) {
		return r.readInt32BE();
	}

	if (type === TYPE.FLOAT64) {
		return r.readDoubleBE();
	}

	if (type === TYPE.STRING) {
		const len = r.readUInt16BE();
		const bytes = r.readBytes(len);
		return new TextDecoder().decode(bytes);
	}

	if (type === TYPE.ARRAY) {
		const len = r.readUInt16BE();
		const arr = [];
		for (let i = 0; i < len; i++) {
			arr.push(decodeValue(r));
		}
		return arr;
	}

	if (type === TYPE.OBJECT) {
		const len = r.readUInt16BE();
		const obj = {};
		for (let i = 0; i < len; i++) {
			const key = decodeValue(r);
			const val = decodeValue(r);
			obj[key] = val;
		}
		return obj;
	}

	throw new TypeError(`Unknown type byte: 0x${type.toString(16)}`);
}

function decodeSection(buf) {
	const r = new BinaryReader(buf);
	const sectionId = r.readUInt8();
	const payloadLength = r.readUInt32BE();
	const value = decodeValue(r);

	return { sectionId, payloadLength, value };
}

export function decode(buf) {
	if (buf.length < 15) {
		throw new Error('Buffer too short for BTNC header (expected at least 15 bytes)');
	}

	const magic = buf.slice(0, 4);
	if (!magic.equals(MAGIC)) {
		throw new Error(`Invalid magic bytes: expected BTNC, got ${magic.toString('hex')}`);
	}

	const version = buf.readUInt16BE(4);
	const sectionCount = buf.readUInt8(6);
	const bodyLength = buf.readUInt32BE(7);
	const storedCRC = buf.readUInt32BE(11);

	const expectedLength = 15 + bodyLength;
	if (buf.length !== expectedLength) {
		throw new Error(`File size mismatch: header declares ${expectedLength} bytes, got ${buf.length}`);
	}

	/*
		CRC32 should cover: header (first 11 bytes) + body
		Excluding the CRC32 field itself at offset 11-14
	*/
	const headerWithoutCRC = buf.slice(0, 11);
	const body = buf.slice(15);
	const dataForChecksum = Buffer.concat([headerWithoutCRC, body]);
	const computedCRC = crc32(dataForChecksum);

	if (storedCRC !== computedCRC) {
		throw new Error(`CRC32 mismatch: stored=0x${storedCRC.toString(16)}, computed=0x${computedCRC.toString(16)}`);
	}

	const sections = [];
	let offset = 0;

	for (let i = 0; i < sectionCount; i++) {
		const sectionBuf = body.slice(offset);
		const { sectionId, payloadLength, value } = decodeSection(sectionBuf);
		sections.push({ sectionId, value });
		offset += 5 + payloadLength;
	}

	const result = { version, sections: {} };

	for (const sec of sections) {
		if (sec.sectionId === SECTION.META) {
			result.sections.meta = sec.value;
		} else if (sec.sectionId === SECTION.ENV) {
			result.sections.env = sec.value;
		} else if (sec.sectionId === SECTION.PROPERTIES) {
			result.sections.properties = sec.value;
		}
	}

	return result;
}

export function validateHeader(buf) {
	if (buf.length < 15) {
		return { valid: false, error: 'Buffer too short for header' };
	}

	const magic = buf.slice(0, 4);
	if (!magic.equals(MAGIC)) {
		return { valid: false, error: `Invalid magic: ${magic.toString('hex')}` };
	}

	const version = buf.readUInt16BE(4);
	const sectionCount = buf.readUInt8(6);
	const bodyLength = buf.readUInt32BE(7);
	const storedCRC = buf.readUInt32BE(11);

	const headerWithoutCRC = buf.slice(0, 11);
	const body = buf.slice(15);
	const dataForChecksum = Buffer.concat([headerWithoutCRC, body]);
	const computedCRC = crc32(dataForChecksum);

	if (storedCRC !== computedCRC) {
		return {
			valid: false,
			error: `CRC32 mismatch: stored=0x${storedCRC.toString(16)}, computed=0x${computedCRC.toString(16)}`
		};
	}

	return {
		valid: true,
		version,
		sectionCount,
		bodyLength,
		crc32: storedCRC
	};
}
