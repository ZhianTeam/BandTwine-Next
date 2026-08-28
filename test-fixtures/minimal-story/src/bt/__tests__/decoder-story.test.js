/*
	File: bt/__tests__/decoder-story.test.js
	Revision number: 1
	License: AGPL-3.0
	Copyleft (c) 2025-2026 ZhianTeam. All rights reserved.

	This is BandTwine. A FLOSS interactive fiction engine.
	BandTwine is a FLOSS Software distributed under AGPL-3.0 license. This software comes with ABSOLUTELY NO WARRANTY.
	You are welcome to redistribute it under certain conditions. See the GNU Affero General Public License for more details.
*/

import { describe, it, expect, beforeAll, afterAll } from '@jest/globals';
import { encode } from '../../../modules/tweecomp/src/encoder.js';
import fs from 'fs';
import path from 'path';

const mockFile = {
	openSync: null,
	readArrayBufferSync: null,
	closeSync: null
};

let testBinary = null;
let loadStory = null;

beforeAll(() => {
	const testData = {
		passages: [
			{
				name: 'Start',
				tags: ['intro', 'main'],
				content: 'Welcome to the story!\n[[Continue->Middle]]'
			},
			{
				name: 'Middle',
				tags: [],
				content: 'You are in the middle.\n[[Go back->Start]]\n[[End->End]]'
			},
			{
				name: 'End',
				tags: ['ending'],
				content: 'The End.'
			}
		]
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
		path.join(process.cwd(), 'src/bt/decoder-story.js'),
		'utf-8'
	);

	const wrappedCode = decoderCode.replace('export function loadStory', 'loadStory = function');
	eval(wrappedCode);
});

afterAll(() => {
	delete global.require;
	delete global.TextDecoder;
});

describe('BTSC Decoder', () => {
	it('should decode valid story file', () => {
		let readPosition = 0;
		mockFile.openSync = () => 1;
		mockFile.closeSync = () => {};
		mockFile.readArrayBufferSync = ({ length }) => {
			const chunk = testBinary.slice(readPosition, readPosition + length);
			readPosition += length;
			return chunk.buffer;
		};

		const story = loadStory('/data/story.bin');

		expect(story.passages.length).toBe(3);
		expect(story.passages[0].name).toBe('Start');
		expect(story.passages[0].tags).toEqual(['intro', 'main']);
		expect(story.passages[0].content).toContain('Welcome to the story!');

		expect(story.passages[1].name).toBe('Middle');
		expect(story.passages[1].tags).toEqual([]);

		expect(story.passages[2].name).toBe('End');
		expect(story.passages[2].tags).toEqual(['ending']);
	});

	it('should provide passageMap for quick lookup', () => {
		let readPosition = 0;
		mockFile.openSync = () => 1;
		mockFile.closeSync = () => {};
		mockFile.readArrayBufferSync = ({ length }) => {
			const chunk = testBinary.slice(readPosition, readPosition + length);
			readPosition += length;
			return chunk.buffer;
		};

		const story = loadStory('/data/story.bin');

		expect(story.passageMap['Start']).toBeDefined();
		expect(story.passageMap['Start'].name).toBe('Start');
		expect(story.passageMap['Middle']).toBeDefined();
		expect(story.passageMap['End']).toBeDefined();
		expect(story.passageMap['NonExistent']).toBeUndefined();
	});

	it('should provide getPassage helper', () => {
		let readPosition = 0;
		mockFile.openSync = () => 1;
		mockFile.closeSync = () => {};
		mockFile.readArrayBufferSync = ({ length }) => {
			const chunk = testBinary.slice(readPosition, readPosition + length);
			readPosition += length;
			return chunk.buffer;
		};

		const story = loadStory('/data/story.bin');

		const passage = story.getPassage('Middle');
		expect(passage).not.toBeNull();
		expect(passage.name).toBe('Middle');

		const missing = story.getPassage('NotFound');
		expect(missing).toBeNull();
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
			loadStory('/data/story.bin');
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
			loadStory('/data/story.bin');
		}).toThrow('bad magic');
	});

	it('should handle file open failure', () => {
		mockFile.openSync = () => -1;

		expect(() => {
			loadStory('/data/story.bin');
		}).toThrow('Failed to open story file');
	});

	it('should handle passages with empty tags', () => {
		let readPosition = 0;
		mockFile.openSync = () => 1;
		mockFile.closeSync = () => {};
		mockFile.readArrayBufferSync = ({ length }) => {
			const chunk = testBinary.slice(readPosition, readPosition + length);
			readPosition += length;
			return chunk.buffer;
		};

		const story = loadStory('/data/story.bin');
		const middle = story.getPassage('Middle');

		expect(middle.tags).toEqual([]);
	});
});
