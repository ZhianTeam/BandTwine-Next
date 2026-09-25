#!/usr/bin/env node
/*
 * File: bin/verify-btnc.js
 * Revision number: 1
 * License: GPL-3.0
 * Copyleft (c) 2025-2026 ZhianTeam. All rights may not reserved.
 *
 * CLI tool to verify BTNC binary format integrity.
 * BandTwine is a FLOSS Software distributed under AGPL-3.0 license. This software comes with ABSOLUTELY NO WARRANTY.
 * You are welcome to redistribute it under certain conditions. See the GNU Affero General Public License for more details.
 */

import { readFileSync } from 'fs';
import { validateHeader, decode } from '../src/decoder.js';

const args = process.argv.slice(2);

if (args.length === 0) {
	console.error('Usage: verify-btnc <file.bin>');
	process.exit(1);
}

const filePath = args[0];

try {
	const buf = readFileSync(filePath);

	console.log('=== BTNC File Verification ===\n');
	console.log(`File: ${filePath}`);
	console.log(`Size: ${buf.length} bytes\n`);

	const validation = validateHeader(buf);

	if (!validation.valid) {
		console.error('❌ INVALID BTNC FILE');
		console.error(`Error: ${validation.error}\n`);
		process.exit(1);
	}

	console.log('✅ Valid BTNC header');
	console.log(`Version: ${validation.version}`);
	console.log(`Sections: ${validation.sectionCount}`);
	console.log(`Body length: ${validation.bodyLength} bytes`);
	console.log(`CRC32: 0x${validation.crc32.toString(16)}\n`);

	console.log('--- Hexdump (first 15 bytes) ---');
	const header = buf.slice(0, 15);
	console.log(header.toString('hex').match(/.{1,2}/g).join(' '));
	console.log(`  Magic:       ${buf.slice(0, 4).toString('hex')} (${buf.slice(0, 4).toString('ascii')})`);
	console.log(`  Version:     ${buf.slice(4, 6).toString('hex')} (${buf.readUInt16BE(4)})`);
	console.log(`  Sections:    ${buf.slice(6, 7).toString('hex')} (${buf.readUInt8(6)})`);
	console.log(`  Body length: ${buf.slice(7, 11).toString('hex')} (${buf.readUInt32BE(7)})`);
	console.log(`  CRC32:       ${buf.slice(11, 15).toString('hex')} (0x${buf.readUInt32BE(11).toString(16)})\n`);

	console.log('--- Decoding sections ---');
	const decoded = decode(buf);

	if (decoded.sections.meta) {
		console.log('META section:', JSON.stringify(decoded.sections.meta, null, 2));
	}

	if (decoded.sections.env) {
		console.log('ENV section:', JSON.stringify(decoded.sections.env, null, 2));
	}

	if (decoded.sections.properties) {
		console.log('PROPERTIES section:', JSON.stringify(decoded.sections.properties, null, 2));
	}

	console.log('\n✅ File verification successful');

} catch (err) {
	console.error('❌ ERROR:', err.message);
	process.exit(1);
}
