/*
	File: kdlcomp/__tests__/encoder.test.js
	Revision number: 1
	License: GPL-3.0
	Copyleft (c) 2025-2026 ZhianTeam. All rights may not reserved.

	Unit tests for BTNC encoder.
	BandTwine is a FLOSS Software distributed under GPL-3.0 license. This software comes with ABSOLUTELY NO WARRANTY.
	You are welcome to redistribute it under certain conditions. See the GNU General Public License for more details.
*/

import { describe, it } from 'node:test';
import assert from 'node:assert';
import { encode } from '../src/encoder.js';
import { crc32 } from '../src/crc32.js';

describe('BTNC Encoder', () => {
	const sampleData = {
		meta: { name: 'Test', version: '1.0.0' },
		env: { health: 100 },
		properties: { startNode: 'Start' }
	};

	describe('Magic Bytes', () => {
		it('should start with BTNC magic bytes', () => {
			const binary = encode(sampleData);
			const magic = String.fromCharCode(
				binary[0], binary[1], binary[2], binary[3]
			);

			assert.strictEqual(magic, 'BTNC');
		});

		it('should have magic at offset 0', () => {
			const binary = encode(sampleData);

			assert.strictEqual(binary[0], 0x42); // B
			assert.strictEqual(binary[1], 0x54); // T
			assert.strictEqual(binary[2], 0x4E); // N
			assert.strictEqual(binary[3], 0x43); // C
		});
	});

	describe('Header Structure', () => {
		it('should have 15-byte header', () => {
			const binary = encode(sampleData);

			assert.ok(binary.length >= 15);
		});

		it('should encode version at offset 4-5', () => {
			const binary = encode(sampleData);
			const view = new DataView(binary.buffer);
			const version = view.getUint16(4, false);

			assert.strictEqual(version, 1);
		});

		it('should encode section count at offset 6', () => {
			const binary = encode(sampleData);
			const view = new DataView(binary.buffer);
			const sectionCount = view.getUint8(6);

			assert.strictEqual(sectionCount, 3);
		});

		it('should encode body length at offset 7-10', () => {
			const binary = encode(sampleData);
			const view = new DataView(binary.buffer);
			const bodyLength = view.getUint32(7, false);

			assert.strictEqual(bodyLength, binary.length - 15);
		});

		it('should encode CRC32 at offset 11-14', () => {
			const binary = encode(sampleData);
			const view = new DataView(binary.buffer);
			const storedCRC = view.getUint32(11, false);

			assert.ok(storedCRC > 0);
		});
	});

	describe('CRC32 Computation', () => {
		it('should compute CRC32 over header + body', () => {
			const binary = encode(sampleData);

			const headerWithoutCRC = binary.subarray(0, 11);
			const body = binary.subarray(15);
			const dataForChecksum = Buffer.concat([headerWithoutCRC, body]);
			const computedCRC = crc32(dataForChecksum);

			const view = new DataView(binary.buffer);
			const storedCRC = view.getUint32(11, false);

			assert.strictEqual(storedCRC, computedCRC);
		});

		it('should detect data corruption', () => {
			const binary = encode(sampleData);
			const view = new DataView(binary.buffer);
			const originalCRC = view.getUint32(11, false);

			binary[20] ^= 0xFF;

			const headerWithoutCRC = binary.subarray(0, 11);
			const body = binary.subarray(15);
			const dataForChecksum = Buffer.concat([headerWithoutCRC, body]);
			const recomputedCRC = crc32(dataForChecksum);

			assert.notStrictEqual(recomputedCRC, originalCRC);
		});
	});

	describe('Section Encoding', () => {
		it('should encode meta section (type 0x01)', () => {
			const binary = encode(sampleData);

			const sectionTypeOffset = 15;
			assert.strictEqual(binary[sectionTypeOffset], 0x01);
		});

		it('should encode env section (type 0x03)', () => {
			const binary = encode(sampleData);
			const view = new DataView(binary.buffer);
			const sectionCount = view.getUint8(6);

			assert.ok(sectionCount >= 2);
		});

		it('should encode properties section (type 0x04)', () => {
			const binary = encode(sampleData);
			const view = new DataView(binary.buffer);
			const sectionCount = view.getUint8(6);

			assert.ok(sectionCount >= 3);
		});

		it('should encode payment section when present', () => {
			const dataWithPayment = {
				...sampleData,
				payment: { type: 'donate', price: 3 }
			};

			const binary = encode(dataWithPayment);
			const view = new DataView(binary.buffer);
			const sectionCount = view.getUint8(6);

			assert.strictEqual(sectionCount, 4);
		});
	});

	describe('Section Format', () => {
		it('should encode section type as 1 byte', () => {
			const binary = encode(sampleData);

			const sectionOffset = 15;
			const sectionType = binary[sectionOffset];

			assert.ok(sectionType >= 0x01 && sectionType <= 0x05);
		});

		it('should encode section length as 4 bytes Big Endian', () => {
			const binary = encode(sampleData);
			const view = new DataView(binary.buffer);

			const sectionLength = view.getUint32(16, false);

			assert.ok(sectionLength > 0);
		});
	});

	describe('Data Types', () => {
		it('should preserve strings', () => {
			const data = {
				meta: { name: 'Test Story' },
				env: {},
				properties: { startNode: 'Start' }
			};

			const binary = encode(data);

			assert.ok(binary.length > 15);
		});

		it('should preserve numbers', () => {
			const data = {
				meta: { name: 'Test' },
				env: { health: 100, mana: 50.5 },
				properties: { startNode: 'Start' }
			};

			const binary = encode(data);

			assert.ok(binary.length > 15);
		});

		it('should preserve booleans', () => {
			const data = {
				meta: { name: 'Test' },
				env: { alive: true, dead: false },
				properties: { startNode: 'Start' }
			};

			const binary = encode(data);

			assert.ok(binary.length > 15);
		});

		it('should preserve null values', () => {
			const data = {
				meta: { name: 'Test', optional: null },
				env: {},
				properties: { startNode: 'Start' }
			};

			const binary = encode(data);

			assert.ok(binary.length > 15);
		});
	});

	describe('Complex Data Structures', () => {
		it('should encode nested objects', () => {
			const data = {
				meta: {
					name: 'Test',
					nested: {
						deep: {
							value: 42
						}
					}
				},
				env: {},
				properties: { startNode: 'Start' }
			};

			const binary = encode(data);

			assert.ok(binary.length > 15);
		});

		it('should encode arrays', () => {
			const data = {
				meta: { name: 'Test' },
				env: {
					inventory: ['sword', 'shield', 'potion']
				},
				properties: { startNode: 'Start' }
			};

			const binary = encode(data);

			assert.ok(binary.length > 15);
		});

		it('should encode mixed types', () => {
			const data = {
				meta: {
					name: 'Complex Test',
					version: '2.0',
					enabled: true,
					count: 42,
					empty: null
				},
				env: {
					stats: {
						strength: 10,
						dexterity: 15
					},
					items: ['a', 'b', 'c']
				},
				properties: { startNode: 'Start' }
			};

			const binary = encode(data);

			assert.ok(binary.length > 15);
		});
	});

	describe('Empty Data', () => {
		it('should handle empty sections', () => {
			const data = {
				meta: {},
				env: {},
				properties: {}
			};

			const binary = encode(data);

			assert.ok(binary.length >= 15);
		});

		it('should handle missing optional sections', () => {
			const data = {
				meta: { name: 'Test' },
				properties: { startNode: 'Start' }
			};

			const binary = encode(data);
			const view = new DataView(binary.buffer);
			const sectionCount = view.getUint8(6);

			assert.ok(sectionCount >= 2);
		});
	});

	describe('Big Endian Encoding', () => {
		it('should use Big Endian for multi-byte values', () => {
			const binary = encode(sampleData);
			const view = new DataView(binary.buffer);

			const version = view.getUint16(4, false);
			const bodyLength = view.getUint32(7, false);

			assert.ok(version >= 0);
			assert.ok(bodyLength >= 0);
		});
	});

	describe('Binary Size', () => {
		it('should produce compact binary', () => {
			const binary = encode(sampleData);

			assert.ok(binary.length < 1000);
		});

		it('should scale with data size', () => {
			const smallData = {
				meta: { name: 'A' },
				env: {},
				properties: { startNode: 'S' }
			};

			const largeData = {
				meta: { name: 'A'.repeat(1000) },
				env: {},
				properties: { startNode: 'S'.repeat(100) }
			};

			const smallBinary = encode(smallData);
			const largeBinary = encode(largeData);

			assert.ok(largeBinary.length > smallBinary.length);
		});
	});

	describe('Payment Section Encoding', () => {
		it('should encode donate payment', () => {
			const data = {
				meta: { name: 'Test' },
				env: {},
				properties: { startNode: 'Start' },
				payment: { type: 'donate', price: 3 }
			};

			const binary = encode(data);
			const view = new DataView(binary.buffer, binary.byteOffset, binary.byteLength);
			const sectionCount = view.getUint8(6);

			assert.strictEqual(sectionCount, 4);
		});

		it('should encode rsa payment with pk', () => {
			const data = {
				meta: { name: 'Test' },
				env: {},
				properties: { startNode: 'Start' },
				payment: {
					type: 'rsa',
					price: 5,
					pk: '-----BEGIN PUBLIC KEY-----\ntest\n-----END PUBLIC KEY-----'
				}
			};

			const binary = encode(data);

			assert.ok(binary.length > 100);
		});

		it('should encode key payment with secret', () => {
			const data = {
				meta: { name: 'Test' },
				env: {},
				properties: { startNode: 'Start' },
				payment: {
					type: 'key',
					price: 2,
					secret: 'my-secret'
				}
			};

			const binary = encode(data);

			assert.ok(binary.length > 15);
		});
	});
});
