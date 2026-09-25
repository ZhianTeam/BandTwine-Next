#!/usr/bin/env node
/*
 * File: bin/create-test-btnc.js
 * Revision number: 1
 * License: GPL-3.0
 * Copyleft (c) 2025-2026 ZhianTeam. All rights may not reserved.
 *
 * Create a test BTNC file for verification.
 */

import { writeFileSync } from 'fs';
import { encode } from '../src/encoder.js';

const testData = {
	meta: {
		name: 'Test Story',
		author: 'BandTwine Team',
		version: '1.0.0',
		description: 'A test story for BTNC format verification'
	},
	env: {
		health: 100,
		mana: 50,
		score: 0,
		inventory: ['sword', 'shield']
	},
	properties: {
		startNode: 'Start',
		debug: false
	}
};

const buf = encode(testData);
writeFileSync('test-output.bin', buf);

console.log('✅ Created test-output.bin');
console.log(`Size: ${buf.length} bytes`);
console.log(`Magic: ${buf.slice(0, 4).toString('hex')} (${buf.slice(0, 4).toString('ascii')})`);
