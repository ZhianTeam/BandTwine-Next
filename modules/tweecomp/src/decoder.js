/*
	File: tweecomp/src/decoder.js
	Revision number: 1
	License: GPL-3.0
	Copyleft (c) 2025-2026 ZhianTeam. All rights may not reserved.

	This is the binary decoder for BandTwine Next Twee compiler.
	BandTwine is a FLOSS Software distributed under AGPL-3.0 license. This software comes with ABSOLUTELY NO WARRANTY.
	You are welcome to redistribute it under certain conditions. See the GNU Affero General Public License for more details.
*/

import { crc32 } from './crc32.js';

const MAGIC = 'BTSC';
const HEADER_SIZE = 18;

export function validateCRC(buffer) {
	if (buffer.length < HEADER_SIZE) {
		return false;
	}

	const storedCRC = buffer.readUInt32BE(14);
	const headerBeforeCRC = buffer.subarray(0, 14);
	const body = buffer.subarray(18);
	const checksumData = Buffer.concat([headerBeforeCRC, body]);
	const computedCRC = crc32(checksumData);

	return storedCRC === computedCRC;
}

export function decode(buffer) {
	if (buffer.length < HEADER_SIZE) {
		throw new Error('Buffer too short for BTSC header');
	}

	let offset = 0;

	const magic = buffer.toString('utf8', offset, offset + 4);
	offset += 4;

	if (magic !== MAGIC) {
		throw new Error(`Invalid magic: expected ${MAGIC}, got ${magic}`);
	}

	const version = buffer.readUInt16BE(offset);
	offset += 2;

	const passageCount = buffer.readUInt32BE(offset);
	offset += 4;

	const bodyLength = buffer.readUInt32BE(offset);
	offset += 4;

	const storedCRC = buffer.readUInt32BE(offset);
	offset += 4;

	if (buffer.length !== HEADER_SIZE + bodyLength) {
		throw new Error(`File size mismatch: expected ${HEADER_SIZE + bodyLength}, got ${buffer.length}`);
	}

	if (!validateCRC(buffer)) {
		throw new Error('CRC32 validation failed');
	}

	const passages = [];

	for (let i = 0; i < passageCount; i++) {
		const id = buffer.readUInt32BE(offset);
		offset += 4;

		const nameLength = buffer.readUInt32BE(offset);
		offset += 4;
		const name = buffer.toString('utf8', offset, offset + nameLength);
		offset += nameLength;

		const tagsLength = buffer.readUInt32BE(offset);
		offset += 4;
		const tagsStr = buffer.toString('utf8', offset, offset + tagsLength);
		offset += tagsLength;
		const tags = tagsStr.length > 0 ? tagsStr.split(',') : [];

		const contentLength = buffer.readUInt32BE(offset);
		offset += 4;
		const content = buffer.toString('utf8', offset, offset + contentLength);
		offset += contentLength;

		passages.push({ id, name, tags, content });
	}

	return {
		version,
		passageCount,
		bodyLength,
		crc32: storedCRC,
		passages
	};
}
