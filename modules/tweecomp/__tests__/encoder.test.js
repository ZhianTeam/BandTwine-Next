/*
	File: tweecomp/__tests__/encoder.test.js
	Revision number: 1
	License: GPL-3.0
	Copyleft (c) 2025-2026 ZhianTeam. All rights may not reserved.

	Unit tests for BTSC encoder.
	BandTwine is a FLOSS Software distributed under GPL-3.0 license. This software comes with ABSOLUTELY NO WARRANTY.
	You are welcome to redistribute it under certain conditions. See the GNU General Public License for more details.
*/

import { describe, it } from 'node:test';
import assert from 'node:assert';
import { encode } from '../src/encoder.js';
import { crc32 } from '../src/crc32.js';

describe('BTSC Encoder', () => {
	const samplePassages = [
		{
			name: 'Start',
			tags: ['start'],
			metadata: {},
			content: 'Welcome to the story.\n[[Next]]'
		},
		{
			name: 'Next',
			tags: [],
			metadata: {},
			content: 'This is the next passage.\n[[Start]]'
		}
	];

	describe('Magic Bytes', () => {
		it('should start with BTSC magic bytes', () => {
			const binary = encode({ passages: samplePassages });
			const magic = String.fromCharCode(
				binary[0], binary[1], binary[2], binary[3]
			);

			assert.strictEqual(magic, 'BTSC');
		});

		it('should have magic at offset 0', () => {
			const binary = encode({ passages: samplePassages });

			assert.strictEqual(binary[0], 0x42); // B
			assert.strictEqual(binary[1], 0x54); // T
			assert.strictEqual(binary[2], 0x53); // S
			assert.strictEqual(binary[3], 0x43); // C
		});
	});

	describe('Header Structure', () => {
		it('should have 15-byte header', () => {
			const binary = encode({ passages: samplePassages });

			assert.ok(binary.length >= 15);
		});

		it('should encode version at offset 4-5', () => {
			const binary = encode({ passages: samplePassages });
			const view = new DataView(binary.buffer);
			const version = view.getUint16(4, false);

			assert.strictEqual(version, 1);
		});

		it('should encode passage count at offset 6-7', () => {
			const binary = encode({ passages: samplePassages });
			const view = new DataView(binary.buffer);
			const passageCount = view.getUint16(6, false);

			assert.strictEqual(passageCount, 2);
		});

		it('should encode body length at offset 8-11', () => {
			const binary = encode({ passages: samplePassages });
			const view = new DataView(binary.buffer);
			const bodyLength = view.getUint32(8, false);

			assert.strictEqual(bodyLength, binary.length - 15);
		});

		it('should encode CRC32 at offset 12-15', () => {
			const binary = encode({ passages: samplePassages });
			const view = new DataView(binary.buffer);
			const storedCRC = view.getUint32(12, false);

			assert.ok(storedCRC > 0);
		});
	});

	describe('CRC32 Computation', () => {
		it('should compute CRC32 over header + body', () => {
			const binary = encode({ passages: samplePassages });

			const headerWithoutCRC = binary.subarray(0, 12);
			const body = binary.subarray(16);
			const dataForChecksum = Buffer.concat([headerWithoutCRC, body]);
			const computedCRC = crc32(dataForChecksum);

			const view = new DataView(binary.buffer);
			const storedCRC = view.getUint32(12, false);

			assert.strictEqual(storedCRC, computedCRC);
		});

		it('should detect data corruption', () => {
			const binary = encode({ passages: samplePassages });
			const view = new DataView(binary.buffer);
			const originalCRC = view.getUint32(12, false);

			binary[20] ^= 0xFF;

			const headerWithoutCRC = binary.subarray(0, 12);
			const body = binary.subarray(16);
			const dataForChecksum = Buffer.concat([headerWithoutCRC, body]);
			const recomputedCRC = crc32(dataForChecksum);

			assert.notStrictEqual(recomputedCRC, originalCRC);
		});
	});

	describe('Passage Encoding', () => {
		it('should encode passage names', () => {
			const binary = encode({ passages: samplePassages });

			assert.ok(binary.length > 15);
		});

		it('should encode passage content', () => {
			const binary = encode({ passages: samplePassages });

			assert.ok(binary.length > 100);
		});

		it('should encode passage tags', () => {
			const passages = [
				{
					name: 'Test',
					tags: ['tag1', 'tag2'],
					metadata: {},
					content: 'Content'
				}
			];

			const binary = encode({ passages: passages });

			assert.ok(binary.length > 15);
		});

		it('should handle empty tags array', () => {
			const passages = [
				{
					name: 'Test',
					tags: [],
					metadata: {},
					content: 'Content'
				}
			];

			const binary = encode({ passages: passages });

			assert.ok(binary.length > 15);
		});
	});

	describe('Multiple Passages', () => {
		it('should encode single passage', () => {
			const passages = [
				{
					name: 'Single',
					tags: [],
					metadata: {},
					content: 'Content'
				}
			];

			const binary = encode({ passages: passages });
			const view = new DataView(binary.buffer);
			const count = view.getUint16(6, false);

			assert.strictEqual(count, 1);
		});

		it('should encode multiple passages', () => {
			const passages = [
				{ name: 'One', tags: [], metadata: {}, content: 'C1' },
				{ name: 'Two', tags: [], metadata: {}, content: 'C2' },
				{ name: 'Three', tags: [], metadata: {}, content: 'C3' }
			];

			const binary = encode({ passages: passages });
			const view = new DataView(binary.buffer);
			const count = view.getUint16(6, false);

			assert.strictEqual(count, 3);
		});

		it('should handle many passages', () => {
			const passages = [];
			for (let i = 0; i < 100; i++) {
				passages.push({
					name: `Passage${i}`,
					tags: [],
					metadata: {},
					content: `Content ${i}`
				});
			}

			const binary = encode({ passages: passages });
			const view = new DataView(binary.buffer);
			const count = view.getUint16(6, false);

			assert.strictEqual(count, 100);
		});
	});

	describe('Content Preservation', () => {
		it('should preserve newlines', () => {
			const passages = [
				{
					name: 'Test',
					tags: [],
					metadata: {},
					content: 'Line1\nLine2\nLine3'
				}
			];

			const binary = encode({ passages: passages });

			assert.ok(binary.length > 15);
		});

		it('should preserve special characters', () => {
			const passages = [
				{
					name: 'Test',
					tags: [],
					metadata: {},
					content: '<>&"\'\\/@#$%^&*()'
				}
			];

			const binary = encode({ passages: passages });

			assert.ok(binary.length > 15);
		});

		it('should preserve Unicode characters', () => {
			const passages = [
				{
					name: 'Test',
					tags: [],
					metadata: {},
					content: '你好世界 🌍 ñoño'
				}
			];

			const binary = encode({ passages: passages });

			assert.ok(binary.length > 15);
		});
	});

	describe('Link Preservation', () => {
		it('should preserve simple links', () => {
			const passages = [
				{
					name: 'Test',
					tags: [],
					metadata: {},
					content: '[[Next Passage]]'
				}
			];

			const binary = encode({ passages: passages });

			assert.ok(binary.length > 15);
		});

		it('should preserve links with display text', () => {
			const passages = [
				{
					name: 'Test',
					tags: [],
					metadata: {},
					content: '[[Go to next|Next]]'
				}
			];

			const binary = encode({ passages: passages });

			assert.ok(binary.length > 15);
		});

		it('should preserve multiple links', () => {
			const passages = [
				{
					name: 'Test',
					tags: [],
					metadata: {},
					content: '[[Link1]]\n[[Link2]]\n[[Link3]]'
				}
			];

			const binary = encode({ passages: passages });

			assert.ok(binary.length > 15);
		});
	});

	describe('Macro Preservation', () => {
		it('should preserve <<set>> macros', () => {
			const passages = [
				{
					name: 'Test',
					tags: [],
					metadata: {},
					content: '<<set $health = 100>>'
				}
			];

			const binary = encode({ passages: passages });

			assert.ok(binary.length > 15);
		});

		it('should preserve <<if>> macros', () => {
			const passages = [
				{
					name: 'Test',
					tags: [],
					metadata: {},
					content: '<<if $x > 0>>Yes<<else>>No<</if>>'
				}
			];

			const binary = encode({ passages: passages });

			assert.ok(binary.length > 15);
		});
	});

	describe('Empty Passages', () => {
		it('should handle empty content', () => {
			const passages = [
				{
					name: 'Empty',
					tags: [],
					metadata: {},
					content: ''
				}
			];

			const binary = encode({ passages: passages });

			assert.ok(binary.length >= 15);
		});

		it('should handle empty array', () => {
			const binary = encode({ passages: [] });
			const view = new DataView(binary.buffer);
			const count = view.getUint16(6, false);

			assert.strictEqual(count, 0);
		});
	});

	describe('Big Endian Encoding', () => {
		it('should use Big Endian for multi-byte values', () => {
			const binary = encode({ passages: samplePassages });
			const view = new DataView(binary.buffer);

			const version = view.getUint16(4, false);
			const passageCount = view.getUint16(6, false);
			const bodyLength = view.getUint32(8, false);

			assert.ok(version >= 0);
			assert.ok(passageCount >= 0);
			assert.ok(bodyLength >= 0);
		});
	});

	describe('Binary Size', () => {
		it('should produce compact binary', () => {
			const passages = [
				{
					name: 'Small',
					tags: [],
					metadata: {},
					content: 'A'
				}
			];

			const binary = encode({ passages: passages });

			assert.ok(binary.length < 500);
		});

		it('should scale with content size', () => {
			const smallPassages = [
				{
					name: 'A',
					tags: [],
					metadata: {},
					content: 'B'
				}
			];

			const largePassages = [
				{
					name: 'A',
					tags: [],
					metadata: {},
					content: 'B'.repeat(1000)
				}
			];

			const smallBinary = encode(smallPassages);
			const largeBinary = encode(largePassages);

			assert.ok(largeBinary.length > smallBinary.length);
		});
	});

	describe('Metadata Handling', () => {
		it('should encode metadata', () => {
			const passages = [
				{
					name: 'Test',
					tags: [],
					metadata: { position: '100,200' },
					content: 'Content'
				}
			];

			const binary = encode({ passages: passages });

			assert.ok(binary.length > 15);
		});

		it('should handle empty metadata', () => {
			const passages = [
				{
					name: 'Test',
					tags: [],
					metadata: {},
					content: 'Content'
				}
			];

			const binary = encode({ passages: passages });

			assert.ok(binary.length > 15);
		});
	});

	describe('Special Passages', () => {
		it('should encode StoryTitle', () => {
			const passages = [
				{
					name: 'StoryTitle',
					tags: [],
					metadata: {},
					content: 'My Story'
				}
			];

			const binary = encode({ passages: passages });

			assert.ok(binary.length > 15);
		});

		it('should encode script passages', () => {
			const passages = [
				{
					name: 'JavaScript',
					tags: ['script'],
					metadata: {},
					content: 'const x = 42;'
				}
			];

			const binary = encode({ passages: passages });

			assert.ok(binary.length > 15);
		});
	});

	describe('Complex Stories', () => {
		it('should encode complete story', () => {
			const passages = [
				{
					name: 'StoryTitle',
					tags: [],
					metadata: {},
					content: 'Test Story'
				},
				{
					name: 'Start',
					tags: ['start'],
					metadata: { position: '0,0' },
					content: 'Welcome!\n<<set $health = 100>>\n[[Next]]'
				},
				{
					name: 'Next',
					tags: [],
					metadata: { position: '100,0' },
					content: '<<if $health > 0>>[[Continue|End]]<</if>>'
				},
				{
					name: 'End',
					tags: ['ending'],
					metadata: { position: '200,0' },
					content: 'The end.'
				}
			];

			const binary = encode({ passages: passages });
			const view = new DataView(binary.buffer);
			const count = view.getUint16(6, false);

			assert.strictEqual(count, 4);
			assert.ok(binary.length > 100);
		});
	});
});
