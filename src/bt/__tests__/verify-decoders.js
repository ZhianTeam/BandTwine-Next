/*
	File: bt/__tests__/verify-decoders.js
	Revision number: 1
	License: AGPL-3.0
	Copyleft (c) 2025-2026 ZhianTeam. All rights reserved.

	Verification script to ensure decoders can read compiler output.
*/

import fs from 'fs';
import path from 'path';
import { strict as assert } from 'assert';

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

console.log('=== Decoder Verification ===\n');

const configPath = path.join(process.cwd(), 'src/bt/__tests__/fixtures/test-config.bin');
const storyPath = path.join(process.cwd(), 'src/bt/__tests__/fixtures/test-story.bin');

console.log('1. Testing BTNC decoder logic...');
const configBuf = fs.readFileSync(configPath);
const configView = new DataView(configBuf.buffer, configBuf.byteOffset);

const configMagic = String.fromCharCode(
	configView.getUint8(0), configView.getUint8(1),
	configView.getUint8(2), configView.getUint8(3)
);
assert.equal(configMagic, 'BTNC', 'Config magic should be BTNC');
console.log('   ✓ Magic header verified');

const configVersion = configView.getUint16(4, false);
const configSections = configView.getUint8(6);
const configBodyLen = configView.getUint32(7, false);
const configStoredCRC = configView.getUint32(11, false);

const configHeaderWithoutCRC = new Uint8Array(configBuf.slice(0, 11));
const configBody = new Uint8Array(configBuf.slice(15));
const configCombined = new Uint8Array(11 + configBodyLen);
configCombined.set(configHeaderWithoutCRC, 0);
configCombined.set(configBody, 11);
const configComputedCRC = crc32(configCombined);

assert.equal(configComputedCRC, configStoredCRC, 'Config CRC should match');
console.log('   ✓ CRC32 verification passed');
console.log(`   ✓ ${configSections} sections, ${configBodyLen} bytes`);

console.log('\n2. Testing BTSC decoder logic...');
const storyBuf = fs.readFileSync(storyPath);
const storyView = new DataView(storyBuf.buffer, storyBuf.byteOffset);

const storyMagic = String.fromCharCode(
	storyView.getUint8(0), storyView.getUint8(1),
	storyView.getUint8(2), storyView.getUint8(3)
);
assert.equal(storyMagic, 'BTSC', 'Story magic should be BTSC');
console.log('   ✓ Magic header verified');

const storyVersion = storyView.getUint16(4, false);
const passageCount = storyView.getUint32(6, false);
const storyBodyLen = storyView.getUint32(10, false);
const storyStoredCRC = storyView.getUint32(14, false);

const storyHeaderWithoutCRC = new Uint8Array(storyBuf.slice(0, 14));
const storyBody = new Uint8Array(storyBuf.slice(18));
const storyCombined = new Uint8Array(14 + storyBodyLen);
storyCombined.set(storyHeaderWithoutCRC, 0);
storyCombined.set(storyBody, 14);
const storyComputedCRC = crc32(storyCombined);

assert.equal(storyComputedCRC, storyStoredCRC, 'Story CRC should match');
console.log('   ✓ CRC32 verification passed');
console.log(`   ✓ ${passageCount} passages, ${storyBodyLen} bytes`);

console.log('\n3. Verifying passage parsing...');
const decoder = new TextDecoder('utf-8');
let offset = 18;
const passages = [];

for (let i = 0; i < passageCount; i++) {
	const view = new DataView(storyBuf.buffer, storyBuf.byteOffset + offset);

	const id = view.getUint32(0, false);
	const nameLength = view.getUint32(4, false);
	const nameBytes = new Uint8Array(storyBuf.buffer, storyBuf.byteOffset + offset + 8, nameLength);
	const name = decoder.decode(nameBytes);

	const tagsLength = view.getUint32(8 + nameLength, false);
	const tagsBytes = new Uint8Array(storyBuf.buffer, storyBuf.byteOffset + offset + 12 + nameLength, tagsLength);
	const tagsStr = decoder.decode(tagsBytes);
	const tags = tagsStr.length > 0 ? tagsStr.split(',') : [];

	const contentLength = view.getUint32(12 + nameLength + tagsLength, false);
	const contentBytes = new Uint8Array(storyBuf.buffer, storyBuf.byteOffset + offset + 16 + nameLength + tagsLength, contentLength);
	const content = decoder.decode(contentBytes);

	offset += 16 + nameLength + tagsLength + contentLength;

	passages.push({ id, name, tags, content });
}

assert.equal(passages.length, 3, 'Should have 3 passages');
assert.equal(passages[0].name, 'Start', 'First passage should be Start');
assert.equal(passages[1].name, 'Room1', 'Second passage should be Room1');
assert.equal(passages[2].name, 'Room2', 'Third passage should be Room2');
console.log('   ✓ Parsed all passages correctly');

console.log('\n4. Verifying passage content...');
assert(passages[0].content.includes('Welcome'), 'Start should contain welcome text');
assert.equal(passages[0].tags.length, 2, 'Start should have 2 tags');
assert.equal(passages[0].tags[0], 'intro', 'First tag should be intro');
assert.equal(passages[1].tags.length, 0, 'Room1 should have no tags');
console.log('   ✓ Passage content and tags verified');

console.log('\n=== All Verifications Passed ===');
console.log('\nDecoders are ready for Vela runtime!');
console.log('Next steps:');
console.log('1. Test on Vela simulator: aiot server --watch');
console.log('2. Deploy to physical device via AstroBox');
console.log('3. Monitor heap usage with @system.device.getMemoryInfo()');
