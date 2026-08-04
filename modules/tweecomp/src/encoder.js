/*
  File: src/encoder.js
  Revision number: 1
  License: GPL-3.0
  Copyleft (c) 2025-2026 ZhianTeam. All rights may not reserved.

  This is the binary encoder for BandTwine Next Twee compiler.
  BandTwine is a FLOSS Software distributed under AGPL-3.0 license. This software comes with ABSOLUTELY NO WARRANTY.
  You are welcome to redistribute it under certain conditions. See the GNU Affero General Public License for more details.
*/

import { crc32 } from './crc32.js';

const MAGIC = Buffer.from('BTSC');
const FORMAT_VERSION = 1;

export function encode(data) {
	const { passages } = data;

	const bodyBuffers = [];
	let totalBodyLength = 0;

	for (let i = 0; i < passages.length; i++) {
		const passage = passages[i];

		const nameBuffer = Buffer.from(passage.name, 'utf8');
		const tagsStr = passage.tags.join(',');
		const tagsBuffer = Buffer.from(tagsStr, 'utf8');
		const contentBuffer = Buffer.from(passage.content, 'utf8');

		const passageBuffer = Buffer.allocUnsafe(
			4 + 4 + nameBuffer.length + 4 + tagsBuffer.length + 4 + contentBuffer.length
		);

		let offset = 0;

		passageBuffer.writeUInt32BE(i, offset);
		offset += 4;

		passageBuffer.writeUInt32BE(nameBuffer.length, offset);
		offset += 4;
		nameBuffer.copy(passageBuffer, offset);
		offset += nameBuffer.length;

		passageBuffer.writeUInt32BE(tagsBuffer.length, offset);
		offset += 4;
		tagsBuffer.copy(passageBuffer, offset);
		offset += tagsBuffer.length;

		passageBuffer.writeUInt32BE(contentBuffer.length, offset);
		offset += 4;
		contentBuffer.copy(passageBuffer, offset);
		offset += contentBuffer.length;

		bodyBuffers.push(passageBuffer);
		totalBodyLength += passageBuffer.length;
	}

	const headerSize = 4 + 2 + 4 + 4 + 4;
	const totalSize = headerSize + totalBodyLength;
	const output = Buffer.allocUnsafe(totalSize);

	let offset = 0;

	MAGIC.copy(output, offset);
	offset += 4;

	output.writeUInt16BE(FORMAT_VERSION, offset);
	offset += 2;

	output.writeUInt32BE(passages.length, offset);
	offset += 4;

	output.writeUInt32BE(totalBodyLength, offset);
	offset += 4;

	const checksumData = output.subarray(0, offset);
	const checksum = crc32(checksumData);
	output.writeUInt32BE(checksum, offset);
	offset += 4;

	for (const buf of bodyBuffers) {
		buf.copy(output, offset);
		offset += buf.length;
	}

	return output;
}
