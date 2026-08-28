/*
 * File: kdlcomp/__tests__/payment-validator.test.js
 * Revision number: 2
 * License: GPL-3.0
 * Copyleft (c) 2025-2026 ZhianTeam. All rights may not reserved.
 *
 * Payment validation tests for BandTwine Next KDL compiler.
 * BandTwine is a FLOSS Software distributed under AGPL-3.0 license. This software comes with ABSOLUTELY NO WARRANTY.
 * You are welcome to redistribute it under certain conditions. See the GNU Affero General Public License for more details.
 */

import { describe, it } from 'node:test';
import assert from 'node:assert';
import { tokenize } from '../src/lexer.js';
import { parse } from '../src/parser.js';
import { validate } from '../src/validator.js';

describe('Payment Validation', () => {
	describe('RSA Payment', () => {
		it('should validate complete RSA payment configuration', () => {
			const source = `
meta {
	name "Test"
	ver {
		id "1.0.0"
		code 1
	}
}
properties {
	startNode "start"
}
payment {
	type "rsa"
	price 3
	rsa {
		endpoint "https://example.com/verify"
		pk "-----BEGIN PUBLIC KEY-----" "MIIBIjANBgkqhkiG9w0BAQEFAAOCAQ8AMIIBCgKCAQEA..." "-----END PUBLIC KEY-----"
		bit 2048
		crypto "pkcs"
		width 8
	}
}
`;
			const tokens = tokenize(source, 'test.kdl');
			const ast = parse(tokens, source, 'test.kdl');
			const result = validate(ast);

			assert.strictEqual(result.valid, true);
			assert.strictEqual(result.errors.length, 0);
			assert.strictEqual(result.data.payment.type, 'rsa');
			assert.strictEqual(result.data.payment.config.endpoint, 'https://example.com/verify');
			assert.ok(result.data.payment.config.publicKey.includes('-----BEGIN PUBLIC KEY-----'));
			assert.strictEqual(result.data.payment.config.bit, 2048);
		});

		it('should error on missing RSA endpoint', () => {
			const source = `
meta {
	name "Test"
	ver {
		id "1.0.0"
		code 1
	}
}
properties {
	startNode "start"
}
payment {
	type "rsa"
	rsa {
		pk "-----BEGIN PUBLIC KEY-----" "test" "-----END PUBLIC KEY-----"
	}
}
`;
			const tokens = tokenize(source, 'test.kdl');
			const ast = parse(tokens, source, 'test.kdl');
			const result = validate(ast);

			assert.strictEqual(result.valid, false);
			assert.ok(result.errors.some(e => e.message.includes("missing required field 'endpoint'")));
		});

		it('should error on missing RSA public key', () => {
			const source = `
meta {
	name "Test"
	ver {
		id "1.0.0"
		code 1
	}
}
properties {
	startNode "start"
}
payment {
	type "rsa"
	rsa {
		endpoint "https://example.com/verify"
	}
}
`;
			const tokens = tokenize(source, 'test.kdl');
			const ast = parse(tokens, source, 'test.kdl');
			const result = validate(ast);

			assert.strictEqual(result.valid, false);
			assert.ok(result.errors.some(e => e.message.includes("missing required field 'pk'")));
		});

		it('should error on invalid PEM format - missing header', () => {
			const source = `
meta {
	name "Test"
	ver {
		id "1.0.0"
		code 1
	}
}
properties {
	startNode "start"
}
payment {
	type "rsa"
	rsa {
		endpoint "https://example.com/verify"
		pk "MIIBIjANBgkqhkiG9w0BAQEFAAOCAQ8AMIIBCgKCAQEA..." "-----END PUBLIC KEY-----"
	}
}
`;
			const tokens = tokenize(source, 'test.kdl');
			const ast = parse(tokens, source, 'test.kdl');
			const result = validate(ast);

			assert.strictEqual(result.valid, false);
			assert.ok(result.errors.some(e => e.message.includes('invalid PEM format, missing header')));
		});

		it('should error on invalid PEM format - missing footer', () => {
			const source = `
meta {
	name "Test"
	ver {
		id "1.0.0"
		code 1
	}
}
properties {
	startNode "start"
}
payment {
	type "rsa"
	rsa {
		endpoint "https://example.com/verify"
		pk "-----BEGIN PUBLIC KEY-----" "MIIBIjANBgkqhkiG9w0BAQEFAAOCAQ8AMIIBCgKCAQEA..."
	}
}
`;
			const tokens = tokenize(source, 'test.kdl');
			const ast = parse(tokens, source, 'test.kdl');
			const result = validate(ast);

			assert.strictEqual(result.valid, false);
			assert.ok(result.errors.some(e => e.message.includes('invalid PEM format, missing footer')));
		});

		it('should warn on HTTP endpoint instead of HTTPS', () => {
			const source = `
meta {
	name "Test"
	ver {
		id "1.0.0"
		code 1
	}
}
properties {
	startNode "start"
}
payment {
	type "rsa"
	rsa {
		endpoint "http://example.com/verify"
		pk "-----BEGIN PUBLIC KEY-----" "test" "-----END PUBLIC KEY-----"
	}
}
`;
			const tokens = tokenize(source, 'test.kdl');
			const ast = parse(tokens, source, 'test.kdl');
			const result = validate(ast);

			assert.ok(result.warnings.some(w => w.message.includes('should use HTTPS for security')));
		});

		it('should error on invalid RSA bit size', () => {
			const source = `
meta {
	name "Test"
	ver {
		id "1.0.0"
		code 1
	}
}
properties {
	startNode "start"
}
payment {
	type "rsa"
	rsa {
		endpoint "https://example.com/verify"
		pk "-----BEGIN PUBLIC KEY-----" "test" "-----END PUBLIC KEY-----"
		bit 512
	}
}
`;
			const tokens = tokenize(source, 'test.kdl');
			const ast = parse(tokens, source, 'test.kdl');
			const result = validate(ast);

			assert.strictEqual(result.valid, false);
			assert.ok(result.errors.some(e => e.message.includes('must be 1024, 2048, or 4096')));
		});

		it('should error on invalid crypto type', () => {
			const source = `
meta {
	name "Test"
	ver {
		id "1.0.0"
		code 1
	}
}
properties {
	startNode "start"
}
payment {
	type "rsa"
	rsa {
		endpoint "https://example.com/verify"
		pk "-----BEGIN PUBLIC KEY-----" "test" "-----END PUBLIC KEY-----"
		crypto "invalid"
	}
}
`;
			const tokens = tokenize(source, 'test.kdl');
			const ast = parse(tokens, source, 'test.kdl');
			const result = validate(ast);

			assert.strictEqual(result.valid, false);
			assert.ok(result.errors.some(e => e.message.includes("must be 'pkcs' or 'oaep'")));
		});

		it('should error on missing rsa block when type is rsa', () => {
			const source = `
meta {
	name "Test"
	ver {
		id "1.0.0"
		code 1
	}
}
properties {
	startNode "start"
}
payment {
	type "rsa"
	price 3
}
`;
			const tokens = tokenize(source, 'test.kdl');
			const ast = parse(tokens, source, 'test.kdl');
			const result = validate(ast);

			assert.strictEqual(result.valid, false);
			assert.ok(result.errors.some(e => e.message.includes("type is 'rsa' but no 'rsa' block found")));
		});
	});

	describe('Donate Payment', () => {
		it('should validate complete donate payment configuration', () => {
			const source = `
meta {
	name "Test"
	ver {
		id "1.0.0"
		code 1
	}
}
properties {
	startNode "start"
}
payment {
	type "donate"
	price 3
	donate {
		supported {
			wechat
			alipay
		}
		wechat {
			link "https://wx.tenpay.com/..."
		}
		alipay {
			link "https://alipay.com/..."
		}
	}
}
`;
			const tokens = tokenize(source, 'test.kdl');
			const ast = parse(tokens, source, 'test.kdl');
			const result = validate(ast);

			assert.strictEqual(result.valid, true);
			assert.strictEqual(result.errors.length, 0);
			assert.strictEqual(result.data.payment.type, 'donate');
			assert.ok(result.data.payment.config.supported.includes('wechat'));
			assert.ok(result.data.payment.config.supported.includes('alipay'));
		});

		it('should validate donate with only wechat', () => {
			const source = `
meta {
	name "Test"
	ver {
		id "1.0.0"
		code 1
	}
}
properties {
	startNode "start"
}
payment {
	type "donate"
	donate {
		supported {
			wechat
		}
		wechat {
			link "https://wx.tenpay.com/..."
		}
	}
}
`;
			const tokens = tokenize(source, 'test.kdl');
			const ast = parse(tokens, source, 'test.kdl');
			const result = validate(ast);

			assert.strictEqual(result.valid, true);
			assert.strictEqual(result.data.payment.config.supported.length, 1);
			assert.strictEqual(result.data.payment.config.supported[0], 'wechat');
		});

		it('should warn on empty supported methods', () => {
			const source = `
meta {
	name "Test"
	ver {
		id "1.0.0"
		code 1
	}
}
properties {
	startNode "start"
}
payment {
	type "donate"
	donate {
		supported {
		}
	}
}
`;
			const tokens = tokenize(source, 'test.kdl');
			const ast = parse(tokens, source, 'test.kdl');
			const result = validate(ast);

			assert.ok(result.warnings.some(w => w.message.includes('no payment methods specified')));
		});

		it('should warn on invalid URL format', () => {
			const source = `
meta {
	name "Test"
	ver {
		id "1.0.0"
		code 1
	}
}
properties {
	startNode "start"
}
payment {
	type "donate"
	donate {
		wechat {
			link "not-a-url"
		}
	}
}
`;
			const tokens = tokenize(source, 'test.kdl');
			const ast = parse(tokens, source, 'test.kdl');
			const result = validate(ast);

			assert.ok(result.warnings.some(w => w.message.includes('should be a valid HTTP(S) URL')));
		});
	});

	describe('Key Payment', () => {
		it('should validate complete key payment configuration', () => {
			const source = `
meta {
	name "Test"
	ver {
		id "1.0.0"
		code 1
	}
}
properties {
	startNode "start"
}
payment {
	type "key"
	price 5
	key {
		show {
			qrcode
			ascii
		}
	}
}
`;
			const tokens = tokenize(source, 'test.kdl');
			const ast = parse(tokens, source, 'test.kdl');
			const result = validate(ast);

			assert.strictEqual(result.valid, true);
			assert.strictEqual(result.errors.length, 0);
			assert.strictEqual(result.data.payment.type, 'key');
			assert.ok(result.data.payment.config.show.includes('qrcode'));
			assert.ok(result.data.payment.config.show.includes('ascii'));
		});

		it('should validate key with only qrcode', () => {
			const source = `
meta {
	name "Test"
	ver {
		id "1.0.0"
		code 1
	}
}
properties {
	startNode "start"
}
payment {
	type "key"
	key {
		show {
			qrcode
		}
	}
}
`;
			const tokens = tokenize(source, 'test.kdl');
			const ast = parse(tokens, source, 'test.kdl');
			const result = validate(ast);

			assert.strictEqual(result.valid, true);
			assert.strictEqual(result.data.payment.config.show.length, 1);
			assert.strictEqual(result.data.payment.config.show[0], 'qrcode');
		});

		it('should error on missing show block', () => {
			const source = `
meta {
	name "Test"
	ver {
		id "1.0.0"
		code 1
	}
}
properties {
	startNode "start"
}
payment {
	type "key"
	key {
	}
}
`;
			const tokens = tokenize(source, 'test.kdl');
			const ast = parse(tokens, source, 'test.kdl');
			const result = validate(ast);

			assert.strictEqual(result.valid, false);
			assert.ok(result.errors.some(e => e.message.includes("missing required field 'show'")));
		});

		it('should error on empty show methods', () => {
			const source = `
meta {
	name "Test"
	ver {
		id "1.0.0"
		code 1
	}
}
properties {
	startNode "start"
}
payment {
	type "key"
	key {
		show {
		}
	}
}
`;
			const tokens = tokenize(source, 'test.kdl');
			const ast = parse(tokens, source, 'test.kdl');
			const result = validate(ast);

			assert.strictEqual(result.valid, false);
			assert.ok(result.errors.some(e => e.message.includes('must specify at least one display method')));
		});

		it('should error on missing key block when type is key', () => {
			const source = `
meta {
	name "Test"
	ver {
		id "1.0.0"
		code 1
	}
}
properties {
	startNode "start"
}
payment {
	type "key"
	price 5
}
`;
			const tokens = tokenize(source, 'test.kdl');
			const ast = parse(tokens, source, 'test.kdl');
			const result = validate(ast);

			assert.strictEqual(result.valid, false);
			assert.ok(result.errors.some(e => e.message.includes("type is 'key' but no 'key' block found")));
		});
	});

	describe('Payment Type Validation', () => {
		it('should error on missing payment type', () => {
			const source = `
meta {
	name "Test"
	ver {
		id "1.0.0"
		code 1
	}
}
properties {
	startNode "start"
}
payment {
	price 3
}
`;
			const tokens = tokenize(source, 'test.kdl');
			const ast = parse(tokens, source, 'test.kdl');
			const result = validate(ast);

			assert.strictEqual(result.valid, false);
			assert.ok(result.errors.some(e => e.message.includes("missing required field 'type'")));
		});

		it('should error on invalid payment type', () => {
			const source = `
meta {
	name "Test"
	ver {
		id "1.0.0"
		code 1
	}
}
properties {
	startNode "start"
}
payment {
	type "invalid"
	price 3
}
`;
			const tokens = tokenize(source, 'test.kdl');
			const ast = parse(tokens, source, 'test.kdl');
			const result = validate(ast);

			assert.strictEqual(result.valid, false);
			assert.ok(result.errors.some(e => e.message.includes("must be 'donate', 'rsa', or 'key'")));
		});

		it('should error on negative price', () => {
			const source = `
meta {
	name "Test"
	ver {
		id "1.0.0"
		code 1
	}
}
properties {
	startNode "start"
}
payment {
	type "donate"
	price -5
	donate {
		wechat {
			link "https://wx.tenpay.com/..."
		}
	}
}
`;
			const tokens = tokenize(source, 'test.kdl');
			const ast = parse(tokens, source, 'test.kdl');
			const result = validate(ast);

			assert.strictEqual(result.valid, false);
			assert.ok(result.errors.some(e => e.message.includes('must be a positive number')));
		});

		it('should allow config without payment node', () => {
			const source = `
meta {
	name "Test"
	ver {
		id "1.0.0"
		code 1
	}
}
properties {
	startNode "start"
}
`;
			const tokens = tokenize(source, 'test.kdl');
			const ast = parse(tokens, source, 'test.kdl');
			const result = validate(ast);

			assert.strictEqual(result.valid, true);
			assert.strictEqual(result.data.payment, null);
		});
	});

	describe('Device Capability Validation', () => {
		it('should error when RSA used on non-crypto device', () => {
			const source = `
meta {
	name "Test"
	ver {
		id "1.0.0"
		code 1
	}
}
properties {
	startNode "start"
}
payment {
	type "rsa"
	rsa {
		endpoint "https://example.com/verify"
		pk "-----BEGIN PUBLIC KEY-----" "test" "-----END PUBLIC KEY-----"
	}
}
`;
			const tokens = tokenize(source, 'test.kdl');
			const ast = parse(tokens, source, 'test.kdl');

			const mockDeviceTree = {
				'n66': {
					pretty: 'Xiaomi Smart Band 9',
					capabilities: new Set([])
				}
			};

			const result = validate(ast, {
				targetDevices: ['n66'],
				deviceTree: mockDeviceTree
			});

			assert.strictEqual(result.valid, false);
			assert.ok(result.errors.some(e =>
				e.message.includes('requires crypto module') &&
				e.message.includes('n66')
			));
		});

		it('should pass when RSA used on crypto-capable device', () => {
			const source = `
meta {
	name "Test"
	ver {
		id "1.0.0"
		code 1
	}
}
properties {
	startNode "start"
}
payment {
	type "rsa"
	rsa {
		endpoint "https://example.com/verify"
		pk "-----BEGIN PUBLIC KEY-----" "test" "-----END PUBLIC KEY-----"
	}
}
`;
			const tokens = tokenize(source, 'test.kdl');
			const ast = parse(tokens, source, 'test.kdl');

			const mockDeviceTree = {
				'n62': {
					pretty: 'Xiaomi Watch S3',
					capabilities: new Set(['crypto'])
				}
			};

			const result = validate(ast, {
				targetDevices: ['n62'],
				deviceTree: mockDeviceTree
			});

			assert.strictEqual(result.valid, true);
		});

		it('should error for multiple unsupported devices', () => {
			const source = `
meta {
	name "Test"
	ver {
		id "1.0.0"
		code 1
	}
}
properties {
	startNode "start"
}
payment {
	type "rsa"
	rsa {
		endpoint "https://example.com/verify"
		pk "-----BEGIN PUBLIC KEY-----" "test" "-----END PUBLIC KEY-----"
	}
}
`;
			const tokens = tokenize(source, 'test.kdl');
			const ast = parse(tokens, source, 'test.kdl');

			const mockDeviceTree = {
				'n66': {
					pretty: 'Xiaomi Smart Band 9',
					capabilities: new Set([])
				},
				'm67': {
					pretty: 'Xiaomi Smart Band 8 Pro',
					capabilities: new Set([])
				}
			};

			const result = validate(ast, {
				targetDevices: ['n66', 'm67'],
				deviceTree: mockDeviceTree
			});

			assert.strictEqual(result.valid, false);
			assert.ok(result.errors.some(e =>
				e.message.includes('n66') && e.message.includes('m67')
			));
		});

		it('should not error for donate on non-crypto devices', () => {
			const source = `
meta {
	name "Test"
	ver {
		id "1.0.0"
		code 1
	}
}
properties {
	startNode "start"
}
payment {
	type "donate"
	donate {
		wechat {
			link "https://wx.tenpay.com/..."
		}
	}
}
`;
			const tokens = tokenize(source, 'test.kdl');
			const ast = parse(tokens, source, 'test.kdl');

			const mockDeviceTree = {
				'n66': {
					pretty: 'Xiaomi Smart Band 9',
					capabilities: new Set([])
				}
			};

			const result = validate(ast, {
				targetDevices: ['n66'],
				deviceTree: mockDeviceTree
			});

			assert.strictEqual(result.valid, true);
		});
	});

	describe('Payment Metadata', () => {
		it('should validate payment title', () => {
			const source = `
meta {
	name "Test"
	ver {
		id "1.0.0"
		code 1
	}
}
properties {
	startNode "start"
}
payment {
	type "donate"
	title "Support the Author"
	donate {
		wechat {
			link "https://wx.tenpay.com/..."
		}
	}
}
`;
			const tokens = tokenize(source, 'test.kdl');
			const ast = parse(tokens, source, 'test.kdl');
			const result = validate(ast);

			assert.strictEqual(result.valid, true);
			assert.strictEqual(result.data.payment.config.title, 'Support the Author');
		});

		it('should validate payment description', () => {
			const source = `
meta {
	name "Test"
	ver {
		id "1.0.0"
		code 1
	}
}
properties {
	startNode "start"
}
payment {
	type "donate"
	description "Line 1" "Line 2" "Line 3"
	donate {
		wechat {
			link "https://wx.tenpay.com/..."
		}
	}
}
`;
			const tokens = tokenize(source, 'test.kdl');
			const ast = parse(tokens, source, 'test.kdl');
			const result = validate(ast);

			assert.strictEqual(result.valid, true);
			assert.strictEqual(result.data.payment.config.description.length, 3);
			assert.strictEqual(result.data.payment.config.description[0], 'Line 1');
		});

		it('should validate payment refresh interval', () => {
			const source = `
meta {
	name "Test"
	ver {
		id "1.0.0"
		code 1
	}
}
properties {
	startNode "start"
}
payment {
	type "donate"
	refresh 30
	donate {
		wechat {
			link "https://wx.tenpay.com/..."
		}
	}
}
`;
			const tokens = tokenize(source, 'test.kdl');
			const ast = parse(tokens, source, 'test.kdl');
			const result = validate(ast);

			assert.strictEqual(result.valid, true);
			assert.strictEqual(result.data.payment.config.refresh, 30);
		});

		it('should error on negative refresh interval', () => {
			const source = `
meta {
	name "Test"
	ver {
		id "1.0.0"
		code 1
	}
}
properties {
	startNode "start"
}
payment {
	type "donate"
	refresh -5
	donate {
		wechat {
			link "https://wx.tenpay.com/..."
		}
	}
}
`;
			const tokens = tokenize(source, 'test.kdl');
			const ast = parse(tokens, source, 'test.kdl');
			const result = validate(ast);

			assert.strictEqual(result.valid, false);
			assert.ok(result.errors.some(e => e.message.includes('must be a non-negative number')));
		});
	});
});
