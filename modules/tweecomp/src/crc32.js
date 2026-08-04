/*
  File: src/crc32.js
  Revision number: 1
  License: GPL-3.0
  Copyleft (c) 2025-2026 ZhianTeam. All rights may not reserved.

  CRC32 checksum implementation.
  BandTwine is a FLOSS Software distributed under AGPL-3.0 license. This software comes with ABSOLUTELY NO WARRANTY.
  You are welcome to redistribute it under certain conditions. See the GNU Affero General Public License for more details.
*/

const CRC32_TABLE = new Uint32Array(256);

for (let i = 0; i < 256; i++) {
	let crc = i;
	for (let j = 0; j < 8; j++) {
		crc = (crc & 1) ? (0xEDB88320 ^ (crc >>> 1)) : (crc >>> 1);
	}
	CRC32_TABLE[i] = crc;
}

export function crc32(data) {
	let crc = 0xFFFFFFFF;
	const buffer = Buffer.isBuffer(data) ? data : Buffer.from(data);

	for (let i = 0; i < buffer.length; i++) {
		const byte = buffer[i];
		crc = CRC32_TABLE[(crc ^ byte) & 0xFF] ^ (crc >>> 8);
	}

	return (crc ^ 0xFFFFFFFF) >>> 0;
}
