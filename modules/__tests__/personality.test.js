/*
	File: personality.test.js
	Revision number: 1
	License: GPL-3.0
	Copyleft (c) 2025-2026 ZhianTeam. All rights may not reserved.

	Tests for Usagi's personality engine.
	BandTwine is a FLOSS Software distributed under AGPL-3.0 license. This software comes with ABSOLUTELY NO WARRANTY.
	You are welcome to redistribute it under certain conditions. See the GNU Affero General Public License for more details.
*/

import { describe, test } from 'node:test';
import assert from 'node:assert';
import {
	expressWarning,
	expressError,
	expressSuccess,
	expressProgress,
	enhanceMessage
} from '../personality.js';

describe('Personality Module', () => {
	describe('expressWarning', () => {
		test('returns warning message with kaomoji', () => {
			const msg = expressWarning('missing-field', { field: 'test' });
			assert.ok(msg.includes('test'));
			assert.ok(/[(（][^)]+[)）]/.test(msg));
		});

		test('handles different warning types', () => {
			const types = ['missing-field', 'invalid-format', 'deprecated', 'unknown-node', 'validation'];
			for (const type of types) {
				const msg = expressWarning(type, { field: 'testField' });
				assert.strictEqual(typeof msg, 'string');
				assert.ok(msg.length > 0);
			}
		});

		test('handles missing context gracefully', () => {
			const msg = expressWarning('missing-field');
			assert.strictEqual(typeof msg, 'string');
			assert.ok(msg.length > 0);
		});
	});

	describe('expressError', () => {
		test('returns error message with sad kaomoji', () => {
			const msg = expressError('parse-error');
			assert.ok(/[(（][^)]+[)）]/.test(msg));
		});

		test('handles different error types', () => {
			const types = ['parse-error', 'validation-error', 'missing-required', 'file-error', 'device-error'];
			for (const type of types) {
				const msg = expressError(type, { field: 'testField' });
				assert.strictEqual(typeof msg, 'string');
				assert.ok(msg.length > 0);
			}
		});

		test('includes field name in missing-required errors', () => {
			const msg = expressError('missing-required', { field: 'importantField' });
			assert.ok(msg.includes('importantField'));
		});
	});

	describe('expressSuccess', () => {
		test('returns success message with happy kaomoji', () => {
			const msg = expressSuccess();
			assert.strictEqual(typeof msg, 'string');
			assert.ok(msg.length > 0);
			assert.ok(/[(（][^)]+[)）]/.test(msg));
		});

		test('returns different messages on multiple calls', () => {
			const messages = new Set();
			for (let i = 0; i < 20; i++) {
				messages.add(expressSuccess());
			}
			assert.ok(messages.size > 1);
		});
	});

	describe('expressProgress', () => {
		test('returns progress message for known steps', () => {
			const steps = ['reading', 'tokenizing', 'parsing', 'validating', 'encoding', 'writing'];
			for (const step of steps) {
				const msg = expressProgress(step);
				assert.strictEqual(typeof msg, 'string');
				assert.ok(msg.length > 0);
			}
		});

		test('handles unknown steps gracefully', () => {
			const msg = expressProgress('unknown-step');
			assert.ok(msg.startsWith('Processing...'));
		});

		test('occasionally adds kaomoji', () => {
			const messages = [];
			for (let i = 0; i < 50; i++) {
				messages.push(expressProgress('reading'));
			}
			const withKaomoji = messages.filter(m => /[(（][^)]+[)）]/.test(m));
			assert.ok(withKaomoji.length > 0);
			assert.ok(withKaomoji.length < messages.length);
		});
	});

	describe('enhanceMessage', () => {
		test('respects cLocale flag', () => {
			const original = 'Missing field: test';
			const enhanced = enhanceMessage(original, 'warning', true);
			assert.strictEqual(enhanced, original);
		});

		test('enhances warning messages probabilistically', () => {
			const original = 'Missing field: test';
			const results = new Set();

			for (let i = 0; i < 50; i++) {
				results.add(enhanceMessage(original, 'warning', false));
			}

			assert.ok(results.size > 1);
		});

		test('enhances error messages probabilistically', () => {
			const original = 'Parse error occurred';
			const results = new Set();

			for (let i = 0; i < 50; i++) {
				results.add(enhanceMessage(original, 'error', false));
			}

			assert.ok(results.size > 1);
		});

		test('detects missing field warnings', () => {
			const messages = [
				'Missing field: name',
				'Field not found: title',
				'Cannot find required field'
			];

			for (const msg of messages) {
				for (let i = 0; i < 20; i++) {
					const enhanced = enhanceMessage(msg, 'warning', false);
					if (enhanced !== msg) {
						assert.ok(/[(（][^)]+[)）]/.test(enhanced));
						break;
					}
				}
			}
		});

		test('detects parse errors', () => {
			const messages = [
				'Parse error at line 10',
				'Syntax error in file',
				'Failed to parse configuration'
			];

			for (const msg of messages) {
				for (let i = 0; i < 20; i++) {
					const enhanced = enhanceMessage(msg, 'error', false);
					if (enhanced !== msg) {
						assert.ok(/[(（][^)]+[)）]/.test(enhanced));
						break;
					}
				}
			}
		});

		test('preserves original message when not enhanced', () => {
			const original = 'Some generic message';
			let unchanged = 0;

			for (let i = 0; i < 30; i++) {
				const result = enhanceMessage(original, 'warning', false);
				if (result === original) {
					unchanged++;
				}
			}

			assert.ok(unchanged > 10);
		});
	});
});
