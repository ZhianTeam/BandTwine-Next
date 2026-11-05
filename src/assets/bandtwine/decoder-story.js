/*
	File: bt/decoder-story.js
	Revision number: 1
	License: AGPL-3.0
	Copyleft (c) 2025-2026 ZhianTeam. All rights reserved.

	This is BandTwine. A FLOSS interactive fiction engine.
	BandTwine is a FLOSS Software distributed under AGPL-3.0 license. This software comes with ABSOLUTELY NO WARRANTY.
	You are welcome to redistribute it under certain conditions. See the GNU Affero General Public License for more details.
*/

const file = require('@system.file');

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

export function loadStory(path) {
	let fd = -1;
	try {
		fd = file.openSync({ path, flag: 'r' });
		if (fd < 0) {
			throw new Error('Failed to open story file: ' + path);
		}

		const headerBuf = file.readArrayBufferSync({ fd, length: 18 });
		const view = new DataView(headerBuf);

		const magic = String.fromCharCode(
			view.getUint8(0), view.getUint8(1),
			view.getUint8(2), view.getUint8(3)
		);
		if (magic !== 'BTSC') {
			throw new Error('Invalid story file: bad magic');
		}

		const version = view.getUint16(4, false);
		const passageCount = view.getUint32(6, false);
		const bodyLength = view.getUint32(10, false);
		const storedCRC = view.getUint32(14, false);

		const bodyBuf = file.readArrayBufferSync({ fd, length: bodyLength });

		const headerWithoutCRC = new Uint8Array(headerBuf.slice(0, 14));
		const bodyArray = new Uint8Array(bodyBuf);
		const combined = new Uint8Array(14 + bodyLength);
		combined.set(headerWithoutCRC, 0);
		combined.set(bodyArray, 14);
		const computedCRC = crc32(combined);

		if (computedCRC !== storedCRC) {
			throw new Error('Story file corrupted: CRC mismatch');
		}

		const passages = [];
		const passageMap = {};
		const decoder = new TextDecoder('utf-8');
		let offset = 0;

		for (let i = 0; i < passageCount; i++) {
			const view = new DataView(bodyBuf, offset);

			const id = view.getUint32(0, false);
			const nameLength = view.getUint32(4, false);
			const nameBytes = new Uint8Array(bodyBuf, offset + 8, nameLength);
			const name = decoder.decode(nameBytes);

			const tagsLength = view.getUint32(8 + nameLength, false);
			const tagsBytes = new Uint8Array(bodyBuf, offset + 12 + nameLength, tagsLength);
			const tagsStr = decoder.decode(tagsBytes);
			const tags = tagsStr.length > 0 ? tagsStr.split(',') : [];

			const contentLength = view.getUint32(12 + nameLength + tagsLength, false);
			const contentBytes = new Uint8Array(bodyBuf, offset + 16 + nameLength + tagsLength, contentLength);
			const content = decoder.decode(contentBytes);

			offset += 16 + nameLength + tagsLength + contentLength;

			const passage = { id, name, tags, content };
			passages.push(passage);
			passageMap[name] = passage;
		}

		return {
			passages,
			passageMap,
			getPassage: function(name) {
				return passageMap[name] || null;
			}
		};
	} finally {
		if (fd >= 0) {
			file.closeSync({ fd });
		}
	}
}
