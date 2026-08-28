/*
	File: bt/decoder-config.js
	Revision number: 1
	License: AGPL-3.0
	Copyleft (c) 2025-2026 ZhianTeam. All rights reserved.

	This is BandTwine. A FLOSS interactive fiction engine.
	BandTwine is a FLOSS Software distributed under AGPL-3.0 license. This software comes with ABSOLUTELY NO WARRANTY.
	You are welcome to redistribute it under certain conditions. See the GNU Affero General Public License for more details.
*/

const file = require('@system.file');

const TYPE = {
	NULL: 0x00,
	BOOL: 0x01,
	INT32: 0x02,
	FLOAT64: 0x03,
	STRING: 0x04,
	ARRAY: 0x10,
	OBJECT: 0x11
};

const CRC32_TABLE = (() => {
	const t = new Uint32Array(256);
	for (let i = 0; i < 256; i++) {
		let c = i;
		for (let k = 0; k < 8; k++) {
			c = (c & 1) ? (0xEDB88320 ^ (c >>> 1)) : (c >>> 1);
		}
		t[i] = c;
	}
	return t;
})();

function crc32(buffer) {
	let crc = 0xFFFFFFFF;
	const bytes = new Uint8Array(buffer);
	for (let i = 0; i < bytes.length; i++) {
		crc = CRC32_TABLE[(crc ^ bytes[i]) & 0xFF] ^ (crc >>> 8);
	}
	return (crc ^ 0xFFFFFFFF) >>> 0;
}

function decodeValue(buffer, offset) {
	const view = new DataView(buffer);
	const type = view.getUint8(offset);
	offset += 1;

	switch (type) {
		case TYPE.NULL:
			return { value: null, offset };

		case TYPE.BOOL:
			return { value: view.getUint8(offset) !== 0, offset: offset + 1 };

		case TYPE.INT32:
			return { value: view.getInt32(offset, false), offset: offset + 4 };

		case TYPE.FLOAT64:
			return { value: view.getFloat64(offset, false), offset: offset + 8 };

		case TYPE.STRING: {
			const strLen = view.getUint16(offset, false);
			offset += 2;
			const decoder = new TextDecoder('utf-8');
			const bytes = new Uint8Array(buffer, offset, strLen);
			return { value: decoder.decode(bytes), offset: offset + strLen };
		}

		case TYPE.ARRAY: {
			const arrLen = view.getUint16(offset, false);
			offset += 2;
			const arr = [];
			for (let i = 0; i < arrLen; i++) {
				const result = decodeValue(buffer, offset);
				arr.push(result.value);
				offset = result.offset;
			}
			return { value: arr, offset };
		}

		case TYPE.OBJECT: {
			const objLen = view.getUint16(offset, false);
			offset += 2;
			const obj = {};
			for (let i = 0; i < objLen; i++) {
				const keyResult = decodeValue(buffer, offset);
				offset = keyResult.offset;
				const valResult = decodeValue(buffer, offset);
				offset = valResult.offset;
				obj[keyResult.value] = valResult.value;
			}
			return { value: obj, offset };
		}

		default:
			throw new Error('Unknown type: ' + type);
	}
}

export function loadConfig(path) {
	let fd = -1;
	try {
		fd = file.openSync({ path, flag: 'r' });
		if (fd < 0) {
			throw new Error('Failed to open config file: ' + path);
		}

		const headerBuf = file.readArrayBufferSync({ fd, length: 15 });
		const view = new DataView(headerBuf);

		const magic = String.fromCharCode(
			view.getUint8(0), view.getUint8(1),
			view.getUint8(2), view.getUint8(3)
		);
		if (magic !== 'BTNC') {
			throw new Error('Invalid config file: bad magic');
		}

		const version = view.getUint16(4, false);
		const sectionCount = view.getUint8(6);
		const bodyLength = view.getUint32(7, false);
		const storedCRC = view.getUint32(11, false);

		const bodyBuf = file.readArrayBufferSync({ fd, length: bodyLength });

		const headerWithoutCRC = new Uint8Array(headerBuf.slice(0, 11));
		const bodyArray = new Uint8Array(bodyBuf);
		const combined = new Uint8Array(11 + bodyLength);
		combined.set(headerWithoutCRC, 0);
		combined.set(bodyArray, 11);
		const computedCRC = crc32(combined);

		if (computedCRC !== storedCRC) {
			throw new Error('Config file corrupted: CRC mismatch');
		}

		let offset = 0;
		const sections = {};
		for (let i = 0; i < sectionCount; i++) {
			const sectionId = bodyArray[offset];
			const sectionLength = new DataView(bodyBuf, offset + 1, 4).getUint32(0, false);
			offset += 5;

			const sectionData = bodyBuf.slice(offset, offset + sectionLength);
			sections[sectionId] = decodeValue(sectionData, 0).value;
			offset += sectionLength;
		}

		return {
			meta: sections[0x01],
			env: sections[0x02],
			properties: sections[0x03],
			payment: sections[0x04]
		};
	} finally {
		if (fd >= 0) {
			file.closeSync({ fd });
		}
	}
}
