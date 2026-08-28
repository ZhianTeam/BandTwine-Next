/*
	File: bt/__tests__/decoder-config.test.js
	Revision number: 1
	License: AGPL-3.0
	Copyleft (c) 2025-2026 ZhianTeam. All rights reserved.

	This is BandTwine. A FLOSS interactive fiction engine.
	BandTwine is a FLOSS Software distributed under AGPL-3.0 license. This software comes with ABSOLUTELY NO WARRANTY.
	You are welcome to redistribute it under certain conditions. See the GNU Affero General Public License for more details.
*/

import { describe, it, expect, beforeAll, afterAll } from '@jest/globals';
import { encode } from '../../../modules/kdlcomp/src/encoder.js';
import fs from 'fs';
import path from 'path';

const mockFile = {
	openSync: null,
	readArrayBufferSync: null,
	closeSync: null
};

let testBinary = null;
let loadConfig = null;

beforeAll(() => {
	const testData = {
		meta: {
			name: 'Test Story',
			version: { id: '1.0.0' },
			author: 'Test Author'
		},
		env: {
			score: 0,
			health: 100
		},
		properties: {
			startNode: 'Start'
		}
	};

	testBinary = encode(testData);

	global.require = (moduleName) => {
		if (moduleName === '@system.file') {
			return mockFile;
		}
		throw new Error('Unknown module: ' + moduleName);
	};

	global.TextDecoder = TextDecoder;
	global.DataView = DataView;
	global.Uint8Array = Uint8Array;

	const decoderCode = fs.readFileSync(
		path.join(process.cwd(), 'src/bt/decoder-config.js'),
		'utf-8'
	);

	const wrappedCode = decoderCode.replace('export function loadConfig', 'loadConfig = function');
	eval(wrappedCode);
});

afterAll(() => {
	delete global.require;
	delete global.TextDecoder;
});

describe('BTNC Decoder', () => {
	it('should decode valid config file', () => {
		let readPosition = 0;
		mockFile.openSync = () => 1;
		mockFile.closeSync = () => {};
		mockFile.readArrayBufferSync = ({ length }) => {
			const chunk = testBinary.slice(readPosition, readPosition + length);
			readPosition += length;
			return chunk.buffer;
		};

		const config = loadConfig('/data/configs.bin');

		expect(config.meta.name).toBe('Test Story');
		expect(config.meta.version.id).toBe('1.0.0');
		expect(config.meta.author).toBe('Test Author');
		expect(config.env.score).toBe(0);
		expect(config.env.health).toBe(100);
		expect(config.properties.startNode).toBe('Start');
	});

	it('should reject corrupted file with CRC mismatch', () => {
		const corruptedBinary = Buffer.from(testBinary);
		corruptedBinary[testBinary.length - 1] ^= 0xFF;

		let readPosition = 0;
		mockFile.openSync = () => 1;
		mockFile.closeSync = () => {};
		mockFile.readArrayBufferSync = ({ length }) => {
			const chunk = corruptedBinary.slice(readPosition, readPosition + length);
			readPosition += length;
			return chunk.buffer;
		};

		expect(() => {
			loadConfig('/data/configs.bin');
		}).toThrow('CRC mismatch');
	});

	it('should reject invalid magic header', () => {
		const invalidBinary = Buffer.from(testBinary);
		invalidBinary[0] = 0x00;

		let readPosition = 0;
		mockFile.openSync = () => 1;
		mockFile.closeSync = () => {};
		mockFile.readArrayBufferSync = ({ length }) => {
			const chunk = invalidBinary.slice(readPosition, readPosition + length);
			readPosition += length;
			return chunk.buffer;
		};

		expect(() => {
			loadConfig('/data/configs.bin');
		}).toThrow('bad magic');
	});

	it('should handle file open failure', () => {
		mockFile.openSync = () => -1;

		expect(() => {
			loadConfig('/data/configs.bin');
		}).toThrow('Failed to open config file');
	});
});
