/*
	File: kdlcomp/__tests__/lexer.test.js
	Revision number: 2
	License: GPL-3.0
	Copyleft (c) 2025-2026 ZhianTeam. All rights may not reserved.

	Unit tests for KDL lexer.
	BandTwine is a FLOSS Software distributed under GPL-3.0 license. This software comes with ABSOLUTELY NO WARRANTY.
	You are welcome to redistribute it under certain conditions. See the GNU General Public License for more details.
*/

import { describe, it } from 'node:test';
import assert from 'node:assert';
import { tokenize, TOKEN_TYPES } from '../src/lexer.js';

describe('KDL Lexer', () => {
	describe('Basic Tokenization', () => {
		it('should tokenize identifiers', () => {
			const tokens = tokenize('meta name version');

			assert.strictEqual(tokens[0].type, TOKEN_TYPES.IDENTIFIER);
			assert.strictEqual(tokens[0].value, 'meta');
			assert.strictEqual(tokens[1].type, TOKEN_TYPES.IDENTIFIER);
			assert.strictEqual(tokens[1].value, 'name');
			assert.strictEqual(tokens[2].type, TOKEN_TYPES.IDENTIFIER);
			assert.strictEqual(tokens[2].value, 'version');
		});

		it('should tokenize quoted strings', () => {
			const tokens = tokenize('"Hello World" "Test"');

			assert.strictEqual(tokens[0].type, TOKEN_TYPES.STRING);
			assert.strictEqual(tokens[0].value, 'Hello World');
			assert.strictEqual(tokens[1].type, TOKEN_TYPES.STRING);
			assert.strictEqual(tokens[1].value, 'Test');
		});

		it('should tokenize raw strings', () => {
			const tokens = tokenize('r#"raw string"# r##"double##hash"##');

			assert.strictEqual(tokens[0].type, TOKEN_TYPES.RAW_STRING);
			assert.strictEqual(tokens[0].value, 'raw string');
			assert.strictEqual(tokens[1].type, TOKEN_TYPES.RAW_STRING);
			assert.strictEqual(tokens[1].value, 'double##hash');
		});

		it('should tokenize numbers', () => {
			const tokens = tokenize('42 3.14 -10 0.5');

			assert.strictEqual(tokens[0].type, TOKEN_TYPES.NUMBER);
			assert.strictEqual(tokens[0].value, 42);
			assert.strictEqual(tokens[1].type, TOKEN_TYPES.NUMBER);
			assert.strictEqual(tokens[1].value, 3.14);
			assert.strictEqual(tokens[2].type, TOKEN_TYPES.NUMBER);
			assert.strictEqual(tokens[2].value, -10);
			assert.strictEqual(tokens[3].type, TOKEN_TYPES.NUMBER);
			assert.strictEqual(tokens[3].value, 0.5);
		});

		it('should tokenize booleans', () => {
			const tokens = tokenize('true false');

			assert.strictEqual(tokens[0].type, TOKEN_TYPES.BOOLEAN);
			assert.strictEqual(tokens[0].value, true);
			assert.strictEqual(tokens[1].type, TOKEN_TYPES.BOOLEAN);
			assert.strictEqual(tokens[1].value, false);
		});

		it('should tokenize null', () => {
			const tokens = tokenize('null');

			assert.strictEqual(tokens[0].type, TOKEN_TYPES.NULL);
			assert.strictEqual(tokens[0].value, null);
		});
	});

	describe('Structural Tokens', () => {
		it('should tokenize braces', () => {
			const tokens = tokenize('{ }');

			assert.strictEqual(tokens[0].type, TOKEN_TYPES.LBRACE);
			assert.strictEqual(tokens[1].type, TOKEN_TYPES.RBRACE);
		});

		it('should tokenize parentheses', () => {
			const tokens = tokenize('( )');

			assert.strictEqual(tokens[0].type, TOKEN_TYPES.LPAREN);
			assert.strictEqual(tokens[1].type, TOKEN_TYPES.RPAREN);
		});

		it('should tokenize equals', () => {
			const tokens = tokenize('key=value');

			assert.strictEqual(tokens[0].type, TOKEN_TYPES.IDENTIFIER);
			assert.strictEqual(tokens[1].type, TOKEN_TYPES.EQUALS);
			assert.strictEqual(tokens[2].type, TOKEN_TYPES.IDENTIFIER);
		});

		it('should tokenize semicolons', () => {
			const tokens = tokenize('node1; node2;');

			assert.strictEqual(tokens[1].type, TOKEN_TYPES.SEMICOLON);
			assert.strictEqual(tokens[3].type, TOKEN_TYPES.SEMICOLON);
		});
	});

	describe('Comments', () => {
		it('should skip line comments', () => {
			const tokens = tokenize('meta // this is a comment\nname');

			assert.strictEqual(tokens[0].type, TOKEN_TYPES.IDENTIFIER);
			assert.strictEqual(tokens[0].value, 'meta');
			assert.strictEqual(tokens[1].type, TOKEN_TYPES.NEWLINE);
			assert.strictEqual(tokens[2].type, TOKEN_TYPES.IDENTIFIER);
			assert.strictEqual(tokens[2].value, 'name');
		});

		it('should skip block comments', () => {
			const tokens = tokenize('meta /* comment */ name');

			assert.strictEqual(tokens[0].type, TOKEN_TYPES.IDENTIFIER);
			assert.strictEqual(tokens[0].value, 'meta');
			assert.strictEqual(tokens[1].type, TOKEN_TYPES.IDENTIFIER);
			assert.strictEqual(tokens[1].value, 'name');
		});

		it('should handle slashdash node comments', () => {
			const tokens = tokenize('node1\n/-node2\nnode3');

			assert.strictEqual(tokens[0].type, TOKEN_TYPES.IDENTIFIER);
			assert.strictEqual(tokens[0].value, 'node1');
			assert.strictEqual(tokens[2].type, TOKEN_TYPES.SLASHDASH);
			assert.strictEqual(tokens[3].type, TOKEN_TYPES.IDENTIFIER);
			assert.strictEqual(tokens[3].value, 'node2');
		});
	});

	describe('Line Tracking', () => {
		it('should track line numbers', () => {
			const tokens = tokenize('line1\nline2\nline3');

			assert.strictEqual(tokens[0].line, 1);
			assert.strictEqual(tokens[2].line, 2);
			assert.strictEqual(tokens[4].line, 3);
		});

		it('should track column numbers', () => {
			const tokens = tokenize('a b c');

			assert.strictEqual(tokens[0].column, 1);
			assert.strictEqual(tokens[1].column, 3);
			assert.strictEqual(tokens[2].column, 5);
		});
	});

	describe('String Escapes', () => {
		it('should handle escaped quotes', () => {
			const tokens = tokenize('"He said \\"Hello\\""');

			assert.strictEqual(tokens[0].type, TOKEN_TYPES.STRING);
			assert.strictEqual(tokens[0].value, 'He said "Hello"');
		});

		it('should handle escape sequences', () => {
			const tokens = tokenize('"Line1\\nLine2\\tTabbed"');

			assert.strictEqual(tokens[0].type, TOKEN_TYPES.STRING);
			assert.strictEqual(tokens[0].value, 'Line1\nLine2\tTabbed');
		});
	});

	describe('Error Cases', () => {
		it('should reject unterminated strings', () => {
			assert.throws(() => {
				tokenize('"unterminated');
			}, /Unterminated string/);
		});

		it('should reject invalid escape sequences', () => {
			assert.throws(() => {
				tokenize('"invalid\\x"');
			}, /Invalid escape sequence/);
		});

		it('should reject unterminated block comments', () => {
			assert.throws(() => {
				tokenize('/* unterminated');
			}, /Unterminated block comment/);
		});
	});

	describe('Whitespace Handling', () => {
		it('should skip spaces and tabs', () => {
			const tokens = tokenize('	 \t	 node	 \t	 ');

			assert.strictEqual(tokens[0].type, TOKEN_TYPES.IDENTIFIER);
			assert.strictEqual(tokens[0].value, 'node');
		});

		it('should preserve newlines', () => {
			const tokens = tokenize('node1\nnode2');

			assert.strictEqual(tokens[0].type, TOKEN_TYPES.IDENTIFIER);
			assert.strictEqual(tokens[1].type, TOKEN_TYPES.NEWLINE);
			assert.strictEqual(tokens[2].type, TOKEN_TYPES.IDENTIFIER);
		});

		it('should handle line continuations', () => {
			const tokens = tokenize('very\\\nlong\\\nidentifier');

			assert.strictEqual(tokens[0].type, TOKEN_TYPES.IDENTIFIER);
			assert.strictEqual(tokens[0].value, 'very');
			assert.strictEqual(tokens[1].type, TOKEN_TYPES.IDENTIFIER);
			assert.strictEqual(tokens[1].value, 'long');
		});
	});

	describe('Complex Documents', () => {
		it('should tokenize complete KDL document', () => {
			const kdl = `
meta {
	name "Test Story"
	version "1.0.0"
}
			`;
			const tokens = tokenize(kdl);

			const types = tokens.map(t => t.type);
			assert.ok(types.includes(TOKEN_TYPES.IDENTIFIER));
			assert.ok(types.includes(TOKEN_TYPES.LBRACE));
			assert.ok(types.includes(TOKEN_TYPES.STRING));
			assert.ok(types.includes(TOKEN_TYPES.RBRACE));
		});
	});
});
