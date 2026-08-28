#!/usr/bin/env node
/*
	File: tweecomp/__tests__/test-encoder.js
	Revision number: 1
	License: GPL-3.0
	Copyleft (c) 2025-2026 ZhianTeam. All rights may not reserved.

	Integration test for encoder with macro compiler.
	BandTwine is a FLOSS Software distributed under AGPL-3.0 license. This software comes with ABSOLUTELY NO WARRANTY.
	You are welcome to redistribute it under certain conditions. See the GNU Affero General Public License for more details.
*/

import { encode } from '../src/encoder.js';

console.log('Testing encoder with compiled macros...\n');

const testStory = {
	passages: [
		{
			name: 'Start',
			tags: ['start'],
			content: 'Welcome to the game! <<set $health = 100>>'
		},
		{
			name: 'Choice',
			tags: [],
			content: '<<if $health > 50>>You feel strong.<<else>>You feel weak.<</if>>'
		},
		{
			name: 'Display',
			tags: [],
			content: 'Your health: <<print $health>>'
		},
		{
			name: 'Navigation',
			tags: [],
			content: '<<link "Continue" "Next">>'
		}
	]
};

try {
	const encoded = encode(testStory);

	console.log('✓ Encoding succeeded');
	console.log(`	 Total size: ${encoded.length} bytes`);

	const magic = encoded.subarray(0, 4).toString('utf8');
	console.log(`	 Magic: ${magic}`);

	if (magic !== 'BTSC') {
		console.error('✗ Invalid magic number');
		process.exit(1);
	}

	const version = encoded.readUInt16BE(4);
	console.log(`	 Format version: ${version}`);

	const passageCount = encoded.readUInt32BE(6);
	console.log(`	 Passage count: ${passageCount}`);

	if (passageCount !== testStory.passages.length) {
		console.error(`✗ Passage count mismatch: expected ${testStory.passages.length}, got ${passageCount}`);
		process.exit(1);
	}

	const bodyLength = encoded.readUInt32BE(10);
	console.log(`	 Body length: ${bodyLength} bytes`);

	const crc = encoded.readUInt32BE(14);
	console.log(`	 CRC32: 0x${crc.toString(16).padStart(8, '0')}`);

	const rawTextSize = testStory.passages.reduce((sum, p) =>
		sum + Buffer.byteLength(p.content, 'utf8'), 0
	);

	const compressionRatio = ((rawTextSize - bodyLength) / rawTextSize * 100).toFixed(1);
	console.log(`\n	 Raw text size: ${rawTextSize} bytes`);
	console.log(`	 Compiled size: ${bodyLength} bytes`);
	console.log(`	 Space saved: ${compressionRatio}%`);

	console.log('\n✓ All encoder tests passed');

} catch (e) {
	console.error('✗ Encoding failed:', e.message);
	console.error(e.stack);
	process.exit(1);
}
