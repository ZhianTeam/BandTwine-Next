/*
	File: kdlcomp/__tests__/validator.test.js
	Revision number: 1
	License: GPL-3.0
	Copyleft (c) 2025-2026 ZhianTeam. All rights may not reserved.

	Unit tests for KDL validator.
	BandTwine is a FLOSS Software distributed under GPL-3.0 license. This software comes with ABSOLUTELY NO WARRANTY.
	You are welcome to redistribute it under certain conditions. See the GNU General Public License for more details.
*/

import { describe, it } from 'node:test';
import assert from 'node:assert';
import { validate } from '../src/validator.js';

describe('KDL Validator', () => {
	describe('Meta Section Validation', () => {
		it('should accept valid meta section', () => {
			const ast = {
				nodes: [
					{
						name: 'meta',
						children: [
							{ name: 'name', args: ['Test Story'] },
							{ name: 'version', args: ['1.0.0'] }
						]
					}
				]
			};

			assert.doesNotThrow(() => validate(ast));
		});

		it('should reject missing required meta fields', () => {
			const ast = {
				nodes: [
					{
						name: 'meta',
						children: []
					}
				]
			};

			assert.throws(() => {
				validate(ast);
			}, /Missing required meta field/);
		});

		it('should reject invalid SPDX license', () => {
			const ast = {
				nodes: [
					{
						name: 'meta',
						children: [
							{ name: 'name', args: ['Test'] },
							{ name: 'version', args: ['1.0.0'] },
							{
								name: 'copyright',
								children: [
									{ name: 'license', args: ['INVALID-LICENSE'] }
								]
							}
						]
					}
				]
			};

			assert.throws(() => {
				validate(ast);
			}, /Invalid SPDX license/);
		});

		it('should accept valid SPDX license', () => {
			const ast = {
				nodes: [
					{
						name: 'meta',
						children: [
							{ name: 'name', args: ['Test'] },
							{ name: 'version', args: ['1.0.0'] },
							{
								name: 'copyright',
								children: [
									{ name: 'license', args: ['AGPL-3.0'] }
								]
							}
						]
					}
				]
			};

			assert.doesNotThrow(() => validate(ast));
		});
	});

	describe('Environment Validation', () => {
		it('should accept valid env section', () => {
			const ast = {
				nodes: [
					{
						name: 'env',
						children: [
							{ name: 'health', args: [100] },
							{ name: 'score', args: [0] }
						]
					}
				]
			};

			assert.doesNotThrow(() => validate(ast));
		});

		it('should reject invalid variable types', () => {
			const ast = {
				nodes: [
					{
						name: 'env',
						children: [
							{ name: 'invalid', args: [{ complex: 'object' }] }
						]
					}
				]
			};

			assert.throws(() => {
				validate(ast);
			}, /Invalid variable type/);
		});

		it('should accept string, number, boolean env values', () => {
			const ast = {
				nodes: [
					{
						name: 'env',
						children: [
							{ name: 'name', args: ['Hero'] },
							{ name: 'level', args: [1] },
							{ name: 'alive', args: [true] }
						]
					}
				]
			};

			assert.doesNotThrow(() => validate(ast));
		});
	});

	describe('Properties Validation', () => {
		it('should require startNode property', () => {
			const ast = {
				nodes: [
					{
						name: 'properties',
						children: []
					}
				]
			};

			assert.throws(() => {
				validate(ast);
			}, /Missing required property.*startNode/);
		});

		it('should accept valid properties section', () => {
			const ast = {
				nodes: [
					{
						name: 'properties',
						children: [
							{ name: 'startNode', args: ['Start'] }
						]
					}
				]
			};

			assert.doesNotThrow(() => validate(ast));
		});

		it('should reject invalid property values', () => {
			const ast = {
				nodes: [
					{
						name: 'properties',
						children: [
							{ name: 'startNode', args: [123] }
						]
					}
				]
			};

			assert.throws(() => {
				validate(ast);
			}, /startNode must be a string/);
		});
	});

	describe('Payment Validation', () => {
		it('should accept donate payment type', () => {
			const ast = {
				nodes: [
					{
						name: 'payment',
						children: [
							{ name: 'type', args: ['donate'] },
							{ name: 'price', args: [3] }
						]
					}
				]
			};

			assert.doesNotThrow(() => validate(ast));
		});

		it('should accept rsa payment type with pk', () => {
			const ast = {
				nodes: [
					{
						name: 'payment',
						children: [
							{ name: 'type', args: ['rsa'] },
							{ name: 'price', args: [5] },
							{ name: 'pk', args: ['-----BEGIN PUBLIC KEY-----\ntest\n-----END PUBLIC KEY-----'] }
						]
					}
				]
			};

			assert.doesNotThrow(() => validate(ast));
		});

		it('should reject rsa without pk', () => {
			const ast = {
				nodes: [
					{
						name: 'payment',
						children: [
							{ name: 'type', args: ['rsa'] },
							{ name: 'price', args: [5] }
						]
					}
				]
			};

			assert.throws(() => {
				validate(ast);
			}, /RSA payment requires.*pk/);
		});

		it('should accept key payment type with secret', () => {
			const ast = {
				nodes: [
					{
						name: 'payment',
						children: [
							{ name: 'type', args: ['key'] },
							{ name: 'price', args: [2] },
							{ name: 'secret', args: ['my-secret-key'] }
						]
					}
				]
			};

			assert.doesNotThrow(() => validate(ast));
		});

		it('should reject invalid payment type', () => {
			const ast = {
				nodes: [
					{
						name: 'payment',
						children: [
							{ name: 'type', args: ['invalid'] }
						]
					}
				]
			};

			assert.throws(() => {
				validate(ast);
			}, /Invalid payment type/);
		});

		it('should reject negative price', () => {
			const ast = {
				nodes: [
					{
						name: 'payment',
						children: [
							{ name: 'type', args: ['donate'] },
							{ name: 'price', args: [-5] }
						]
					}
				]
			};

			assert.throws(() => {
				validate(ast);
			}, /Price must be.*positive/);
		});
	});

	describe('Cross-Section Validation', () => {
		it('should accept complete valid config', () => {
			const ast = {
				nodes: [
					{
						name: 'meta',
						children: [
							{ name: 'name', args: ['Test'] },
							{ name: 'version', args: ['1.0.0'] }
						]
					},
					{
						name: 'env',
						children: [
							{ name: 'health', args: [100] }
						]
					},
					{
						name: 'properties',
						children: [
							{ name: 'startNode', args: ['Start'] }
						]
					}
				]
			};

			assert.doesNotThrow(() => validate(ast));
		});

		it('should reject duplicate sections', () => {
			const ast = {
				nodes: [
					{ name: 'meta', children: [] },
					{ name: 'meta', children: [] }
				]
			};

			assert.throws(() => {
				validate(ast);
			}, /Duplicate section/);
		});
	});

	describe('PEM Key Validation', () => {
		it('should validate PEM format', () => {
			const validPEM = `-----BEGIN PUBLIC KEY-----
MIIBIjANBgkqhkiG9w0BAQEFAAOCAQ8AMIIBCgKCAQEA
-----END PUBLIC KEY-----`;

			const ast = {
				nodes: [
					{
						name: 'payment',
						children: [
							{ name: 'type', args: ['rsa'] },
							{ name: 'price', args: [5] },
							{ name: 'pk', args: [validPEM] }
						]
					}
				]
			};

			assert.doesNotThrow(() => validate(ast));
		});

		it('should reject invalid PEM format', () => {
			const invalidPEM = 'not a valid PEM key';

			const ast = {
				nodes: [
					{
						name: 'payment',
						children: [
							{ name: 'type', args: ['rsa'] },
							{ name: 'price', args: [5] },
							{ name: 'pk', args: [invalidPEM] }
						]
					}
				]
			};

			assert.throws(() => {
				validate(ast);
			}, /Invalid PEM format/);
		});
	});

	describe('Optional Sections', () => {
		it('should allow missing payment section', () => {
			const ast = {
				nodes: [
					{
						name: 'meta',
						children: [
							{ name: 'name', args: ['Test'] },
							{ name: 'version', args: ['1.0.0'] }
						]
					},
					{
						name: 'properties',
						children: [
							{ name: 'startNode', args: ['Start'] }
						]
					}
				]
			};

			assert.doesNotThrow(() => validate(ast));
		});

		it('should allow missing env section', () => {
			const ast = {
				nodes: [
					{
						name: 'meta',
						children: [
							{ name: 'name', args: ['Test'] },
							{ name: 'version', args: ['1.0.0'] }
						]
					},
					{
						name: 'properties',
						children: [
							{ name: 'startNode', args: ['Start'] }
						]
					}
				]
			};

			assert.doesNotThrow(() => validate(ast));
		});
	});

	describe('Nested Field Parsing', () => {
		it('should extract release from ver.release block', () => {
			const ast = {
				children: [
					{
						name: 'meta',
						disabled: false,
						line: 1,
						column: 1,
						arguments: [],
						properties: [],
						children: [
							{
								name: 'name',
								disabled: false,
								arguments: [{ value: 'Test' }],
								properties: [],
								children: []
							},
							{
								name: 'ver',
								disabled: false,
								arguments: [],
								properties: [],
								children: [
									{
										name: 'id',
										disabled: false,
										arguments: [{ value: '1.0.0' }],
										properties: [],
										children: []
									},
									{
										name: 'code',
										disabled: false,
										arguments: [{ value: 1 }],
										properties: [],
										children: []
									},
									{
										name: 'release',
										disabled: false,
										arguments: [{ value: '2026-08-01' }],
										properties: [],
										children: []
									}
								]
							}
						]
					},
					{
						name: 'properties',
						disabled: false,
						arguments: [],
						properties: [],
						children: [
							{
								name: 'startNode',
								disabled: false,
								arguments: [{ value: 'start' }],
								properties: [],
								children: []
							}
						]
					}
				]
			};

			const result = validate(ast);
			assert.strictEqual(result.valid, true);
			assert.strictEqual(result.data.meta.release, '2026-08-01');
		});

		it('should validate release date format in ver block', () => {
			const ast = {
				children: [
					{
						name: 'meta',
						disabled: false,
						line: 1,
						column: 1,
						arguments: [],
						properties: [],
						children: [
							{
								name: 'name',
								disabled: false,
								line: 2,
								column: 3,
								arguments: [{ value: 'Test' }],
								properties: [],
								children: []
							},
							{
								name: 'ver',
								disabled: false,
								line: 3,
								column: 3,
								arguments: [],
								properties: [],
								children: [
									{
										name: 'id',
										disabled: false,
										line: 4,
										column: 5,
										arguments: [{ value: '1.0.0' }],
										properties: [],
										children: []
									},
									{
										name: 'code',
										disabled: false,
										line: 5,
										column: 5,
										arguments: [{ value: 1 }],
										properties: [],
										children: []
									},
									{
										name: 'release',
										disabled: false,
										line: 6,
										column: 5,
										arguments: [{ value: 'invalid-date' }],
										properties: [],
										children: []
									}
								]
							}
						]
					},
					{
						name: 'properties',
						disabled: false,
						arguments: [],
						properties: [],
						children: [
							{
								name: 'startNode',
								disabled: false,
								arguments: [{ value: 'start' }],
								properties: [],
								children: []
							}
						]
					}
				]
			};

			const result = validate(ast);
			assert.strictEqual(result.valid, false);
			assert.ok(result.errors.some(e => e.message.includes('not a valid date')));
		});

		it('should extract multi-license array from copyright.license', () => {
			const ast = {
				children: [
					{
						name: 'meta',
						disabled: false,
						arguments: [],
						properties: [],
						children: [
							{
								name: 'name',
								disabled: false,
								arguments: [{ value: 'Test' }],
								properties: [],
								children: []
							},
							{
								name: 'ver',
								disabled: false,
								arguments: [],
								properties: [],
								children: [
									{
										name: 'id',
										disabled: false,
										arguments: [{ value: '1.0.0' }],
										properties: [],
										children: []
									},
									{
										name: 'code',
										disabled: false,
										arguments: [{ value: 1 }],
										properties: [],
										children: []
									}
								]
							},
							{
								name: 'copyright',
								disabled: false,
								arguments: [],
								properties: [],
								children: [
									{
										name: 'license',
										disabled: false,
										arguments: [
											{ value: 'MIT' },
											{ value: 'Apache-2.0' },
											{ value: 'GPL-3.0' }
										],
										properties: [],
										children: []
									},
									{
										name: 'owner',
										disabled: false,
										arguments: [{ value: 'Test Owner' }],
										properties: [],
										children: []
									}
								]
							}
						]
					},
					{
						name: 'properties',
						disabled: false,
						arguments: [],
						properties: [],
						children: [
							{
								name: 'startNode',
								disabled: false,
								arguments: [{ value: 'start' }],
								properties: [],
								children: []
							}
						]
					}
				]
			};

			const result = validate(ast);
			assert.strictEqual(result.valid, true);
			assert.deepStrictEqual(result.data.meta.licenses, ['MIT', 'Apache-2.0', 'GPL-3.0']);
		});
	});

	describe('Payment Configuration Validation', () => {
		it('should parse donate payment with nested config', () => {
			const ast = {
				children: [
					{
						name: 'meta',
						disabled: false,
						arguments: [],
						properties: [],
						children: [
							{
								name: 'name',
								disabled: false,
								arguments: [{ value: 'Test' }],
								properties: [],
								children: []
							},
							{
								name: 'ver',
								disabled: false,
								arguments: [],
								properties: [],
								children: [
									{
										name: 'id',
										disabled: false,
										arguments: [{ value: '1.0.0' }],
										properties: [],
										children: []
									},
									{
										name: 'code',
										disabled: false,
										arguments: [{ value: 1 }],
										properties: [],
										children: []
									}
								]
							}
						]
					},
					{
						name: 'properties',
						disabled: false,
						arguments: [],
						properties: [],
						children: [
							{
								name: 'startNode',
								disabled: false,
								arguments: [{ value: 'start' }],
								properties: [],
								children: []
							}
						]
					},
					{
						name: 'payment',
						disabled: false,
						line: 10,
						column: 1,
						arguments: [],
						properties: [],
						children: [
							{
								name: 'enable',
								disabled: false,
								arguments: [],
								properties: [],
								children: []
							},
							{
								name: 'type',
								disabled: false,
								line: 11,
								column: 3,
								arguments: [{ value: 'donate' }],
								properties: [],
								children: []
							},
							{
								name: 'price',
								disabled: false,
								arguments: [{ value: 3 }],
								properties: [],
								children: []
							},
							{
								name: 'donate',
								disabled: false,
								arguments: [],
								properties: [],
								children: [
									{
										name: 'supported',
										disabled: false,
										arguments: [],
										properties: [],
										children: [
											{
												name: 'wechat',
												disabled: false,
												arguments: [],
												properties: [],
												children: []
											},
											{
												name: 'alipay',
												disabled: false,
												arguments: [],
												properties: [],
												children: []
											}
										]
									},
									{
										name: 'wechat',
										disabled: false,
										arguments: [],
										properties: [],
										children: [
											{
												name: 'link',
												disabled: false,
												arguments: [{ value: 'https://wx.tenpay.com/test' }],
												properties: [],
												children: []
											}
										]
									}
								]
							}
						]
					}
				]
			};

			const result = validate(ast);
			assert.strictEqual(result.valid, true);
			assert.strictEqual(result.data.payment.type, 'donate');
			assert.strictEqual(result.data.payment.enable, true);
			assert.strictEqual(result.data.payment.price, 3);
			assert.deepStrictEqual(result.data.payment.config.supported, ['wechat', 'alipay']);
		});

		it('should parse rsa payment with multi-line PEM key', () => {
			const ast = {
				children: [
					{
						name: 'meta',
						disabled: false,
						arguments: [],
						properties: [],
						children: [
							{
								name: 'name',
								disabled: false,
								arguments: [{ value: 'Test' }],
								properties: [],
								children: []
							},
							{
								name: 'ver',
								disabled: false,
								arguments: [],
								properties: [],
								children: [
									{
										name: 'id',
										disabled: false,
										arguments: [{ value: '1.0.0' }],
										properties: [],
										children: []
									},
									{
										name: 'code',
										disabled: false,
										arguments: [{ value: 1 }],
										properties: [],
										children: []
									}
								]
							}
						]
					},
					{
						name: 'properties',
						disabled: false,
						arguments: [],
						properties: [],
						children: [
							{
								name: 'startNode',
								disabled: false,
								arguments: [{ value: 'start' }],
								properties: [],
								children: []
							}
						]
					},
					{
						name: 'payment',
						disabled: false,
						line: 10,
						column: 1,
						arguments: [],
						properties: [],
						children: [
							{
								name: 'type',
								disabled: false,
								line: 11,
								column: 3,
								arguments: [{ value: 'rsa' }],
								properties: [],
								children: []
							},
							{
								name: 'rsa',
								disabled: false,
								line: 12,
								column: 3,
								arguments: [],
								properties: [],
								children: [
									{
										name: 'endpoint',
										disabled: false,
										line: 13,
										column: 5,
										arguments: [{ value: 'https://example.com/verify' }],
										properties: [],
										children: []
									},
									{
										name: 'pk',
										disabled: false,
										line: 14,
										column: 5,
										arguments: [
											{ value: '-----BEGIN PUBLIC KEY-----' },
											{ value: 'MIIBIjANBgkqhkiG9w0BAQEFAAOCAQ8A...' },
											{ value: '-----END PUBLIC KEY-----' }
										],
										properties: [],
										children: []
									},
									{
										name: 'bit',
										disabled: false,
										arguments: [{ value: 2048 }],
										properties: [],
										children: []
									}
								]
							}
						]
					}
				]
			};

			const result = validate(ast);
			assert.strictEqual(result.valid, true);
			assert.strictEqual(result.data.payment.type, 'rsa');
			assert.strictEqual(result.data.payment.config.endpoint, 'https://example.com/verify');
			assert.ok(result.data.payment.config.publicKey.includes('-----BEGIN PUBLIC KEY-----'));
			assert.ok(result.data.payment.config.publicKey.includes('-----END PUBLIC KEY-----'));
			assert.strictEqual(result.data.payment.config.bit, 2048);
		});

		it('should error on missing rsa endpoint', () => {
			const ast = {
				children: [
					{
						name: 'meta',
						disabled: false,
						arguments: [],
						properties: [],
						children: [
							{
								name: 'name',
								disabled: false,
								arguments: [{ value: 'Test' }],
								properties: [],
								children: []
							},
							{
								name: 'ver',
								disabled: false,
								arguments: [],
								properties: [],
								children: [
									{
										name: 'id',
										disabled: false,
										arguments: [{ value: '1.0.0' }],
										properties: [],
										children: []
									},
									{
										name: 'code',
										disabled: false,
										arguments: [{ value: 1 }],
										properties: [],
										children: []
									}
								]
							}
						]
					},
					{
						name: 'properties',
						disabled: false,
						arguments: [],
						properties: [],
						children: [
							{
								name: 'startNode',
								disabled: false,
								arguments: [{ value: 'start' }],
								properties: [],
								children: []
							}
						]
					},
					{
						name: 'payment',
						disabled: false,
						line: 10,
						column: 1,
						arguments: [],
						properties: [],
						children: [
							{
								name: 'type',
								disabled: false,
								line: 11,
								column: 3,
								arguments: [{ value: 'rsa' }],
								properties: [],
								children: []
							},
							{
								name: 'rsa',
								disabled: false,
								line: 12,
								column: 3,
								arguments: [],
								properties: [],
								children: [
									{
										name: 'pk',
										disabled: false,
										arguments: [
											{ value: '-----BEGIN PUBLIC KEY-----' },
											{ value: 'test' },
											{ value: '-----END PUBLIC KEY-----' }
										],
										properties: [],
										children: []
									}
								]
							}
						]
					}
				]
			};

			const result = validate(ast);
			assert.strictEqual(result.valid, false);
			assert.ok(result.errors.some(e => e.message.includes("missing required field 'endpoint'")));
		});
	});
});
