/*
	File: kdlcomp/__tests__/parser.test.js
	Revision number: 1
	License: GPL-3.0
	Copyleft (c) 2025-2026 ZhianTeam. All rights may not reserved.

	Unit tests for KDL parser.
	BandTwine is a FLOSS Software distributed under GPL-3.0 license. This software comes with ABSOLUTELY NO WARRANTY.
	You are welcome to redistribute it under certain conditions. See the GNU General Public License for more details.
*/

import { describe, it } from 'node:test';
import assert from 'node:assert';
import { tokenize } from '../src/lexer.js';
import { parse as parseTokens } from '../src/parser.js';

function parse(source) {
	const tokens = tokenize(source);
	return parseTokens(tokens, source, 'test.kdl');
}

describe('KDL Parser', () => {
	describe('Basic Node Parsing', () => {
		it('should parse simple node', () => {
			const ast = parse('meta');

			assert.strictEqual(ast.nodes.length, 1);
			assert.strictEqual(ast.nodes[0].name, 'meta');
		});

		it('should parse node with string argument', () => {
			const ast = parse('meta "Test Story"');

			assert.strictEqual(ast.nodes[0].name, 'meta');
			assert.strictEqual(ast.nodes[0].args.length, 1);
			assert.strictEqual(ast.nodes[0].args[0], 'Test Story');
		});

		it('should parse node with multiple arguments', () => {
			const ast = parse('node "arg1" 42 true');

			assert.strictEqual(ast.nodes[0].args.length, 3);
			assert.strictEqual(ast.nodes[0].args[0], 'arg1');
			assert.strictEqual(ast.nodes[0].args[1], 42);
			assert.strictEqual(ast.nodes[0].args[2], true);
		});

		it('should parse node with properties', () => {
			const ast = parse('meta name="Test" version="1.0"');

			assert.strictEqual(ast.nodes[0].props.name, 'Test');
			assert.strictEqual(ast.nodes[0].props.version, '1.0');
		});
	});

	describe('Nested Nodes', () => {
		it('should parse nested children', () => {
			const kdl = `
meta {
	name "Test"
	version "1.0"
}
			`;
			const ast = parse(kdl);

			assert.strictEqual(ast.nodes[0].name, 'meta');
			assert.strictEqual(ast.nodes[0].children.length, 2);
			assert.strictEqual(ast.nodes[0].children[0].name, 'name');
			assert.strictEqual(ast.nodes[0].children[1].name, 'version');
		});

		it('should parse deeply nested structure', () => {
			const kdl = `
root {
	level1 {
		level2 {
			level3 "value"
		}
	}
}
			`;
			const ast = parse(kdl);

			const root = ast.nodes[0];
			const level1 = root.children[0];
			const level2 = level1.children[0];
			const level3 = level2.children[0];

			assert.strictEqual(level3.name, 'level3');
			assert.strictEqual(level3.args[0], 'value');
		});

		it('should parse multiple children at same level', () => {
			const kdl = `
parent {
	child1
	child2
	child3
}
			`;
			const ast = parse(kdl);

			assert.strictEqual(ast.nodes[0].children.length, 3);
			assert.strictEqual(ast.nodes[0].children[0].name, 'child1');
			assert.strictEqual(ast.nodes[0].children[1].name, 'child2');
			assert.strictEqual(ast.nodes[0].children[2].name, 'child3');
		});
	});

	describe('Type Annotations', () => {
		it('should parse type annotations', () => {
			const ast = parse('node (i32)42');

			assert.strictEqual(ast.nodes[0].args.length, 1);
			assert.strictEqual(ast.nodes[0].args[0], 42);
		});

		it('should parse property type annotations', () => {
			const ast = parse('node key=(string)"value"');

			assert.strictEqual(ast.nodes[0].props.key, 'value');
		});
	});

	describe('Comments Handling', () => {
		it('should skip node comments with slashdash', () => {
			const kdl = `
node1
/-node2
node3
			`;
			const ast = parse(kdl);

			assert.strictEqual(ast.nodes.length, 2);
			assert.strictEqual(ast.nodes[0].name, 'node1');
			assert.strictEqual(ast.nodes[1].name, 'node3');
		});

		it('should skip line comments', () => {
			const kdl = `
node1 // comment
node2
			`;
			const ast = parse(kdl);

			assert.strictEqual(ast.nodes.length, 2);
		});
	});

	describe('Multiple Nodes', () => {
		it('should parse semicolon-separated nodes', () => {
			const ast = parse('node1; node2; node3');

			assert.strictEqual(ast.nodes.length, 3);
		});

		it('should parse newline-separated nodes', () => {
			const kdl = `
node1
node2
node3
			`;
			const ast = parse(kdl);

			assert.strictEqual(ast.nodes.length, 3);
		});
	});

	describe('Complex Documents', () => {
		it('should parse complete config.kdl structure', () => {
			const kdl = `
meta {
	name "Test Story"
	version "1.0.0"
}

env {
	health 100
	score 0
}

properties {
	startNode "Start"
}
			`;
			const ast = parse(kdl);

			assert.strictEqual(ast.nodes.length, 3);
			assert.strictEqual(ast.nodes[0].name, 'meta');
			assert.strictEqual(ast.nodes[1].name, 'env');
			assert.strictEqual(ast.nodes[2].name, 'properties');
		});

		it('should parse payment configuration', () => {
			const kdl = `
payment {
	type "rsa"
	price 5
	pk r#"-----BEGIN PUBLIC KEY-----
MIIBIjANBgkqhkiG9w0BAQEFAAOCAQ8AMIIBCgKCAQEA...
-----END PUBLIC KEY-----"#
}
			`;
			const ast = parse(kdl);

			assert.strictEqual(ast.nodes[0].name, 'payment');
			assert.ok(ast.nodes[0].children.length >= 2);
		});
	});

	describe('Error Cases', () => {
		it('should reject unclosed braces', () => {
			assert.throws(() => {
				parse('meta {');
			}, /Expected.*RBRACE/);
		});

		it('should reject invalid property syntax', () => {
			assert.throws(() => {
				parse('node key=');
			}, /Expected value/);
		});

		it('should reject unexpected EOF', () => {
			assert.throws(() => {
				parse('meta { name');
			}, /Expected/);
		});
	});

	describe('Edge Cases', () => {
		it('should handle empty document', () => {
			const ast = parse('');

			assert.strictEqual(ast.nodes.length, 0);
		});

		it('should handle document with only comments', () => {
			const ast = parse('// only comments\n/* more comments */');

			assert.strictEqual(ast.nodes.length, 0);
		});

		it('should handle empty children blocks', () => {
			const ast = parse('node {}');

			assert.strictEqual(ast.nodes[0].children.length, 0);
		});

		it('should handle mixed args and props', () => {
			const ast = parse('node "arg" key="value" 42');

			assert.strictEqual(ast.nodes[0].args.length, 2);
			assert.strictEqual(ast.nodes[0].props.key, 'value');
		});
	});

	describe('Value Types', () => {
		it('should preserve null values', () => {
			const ast = parse('node null');

			assert.strictEqual(ast.nodes[0].args[0], null);
		});

		it('should preserve boolean values', () => {
			const ast = parse('node true false');

			assert.strictEqual(ast.nodes[0].args[0], true);
			assert.strictEqual(ast.nodes[0].args[1], false);
		});

		it('should preserve number types', () => {
			const ast = parse('node 42 3.14 -10 0.5');

			assert.strictEqual(ast.nodes[0].args[0], 42);
			assert.strictEqual(ast.nodes[0].args[1], 3.14);
			assert.strictEqual(ast.nodes[0].args[2], -10);
			assert.strictEqual(ast.nodes[0].args[3], 0.5);
		});
	});
});
