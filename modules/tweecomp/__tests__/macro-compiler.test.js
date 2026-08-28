/*
	File: tweecomp/__tests__/macro-compiler.test.js
	Revision number: 1
	License: GPL-3.0
	Copyleft (c) 2025-2026 ZhianTeam. All rights may not reserved.

	Tests for BandTwine Next macro compiler.
	BandTwine is a FLOSS Software distributed under AGPL-3.0 license. This software comes with ABSOLUTELY NO WARRANTY.
	You are welcome to redistribute it under certain conditions. See the GNU Affero General Public License for more details.
*/

import { describe, it, expect } from '@jest/globals';
import { MacroCompiler, MacroCompileError } from '../src/macro-compiler.js';

describe('MacroCompiler', () => {
	let compiler;

	beforeEach(() => {
		compiler = new MacroCompiler();
	});

	describe('Text-only passages', () => {
		it('compiles plain text without macros', () => {
			const result = compiler.compile('Hello world!');
			expect(result).toEqual([
				{ type: 'text', value: 'Hello world!' }
			]);
		});

		it('preserves whitespace and newlines', () => {
			const result = compiler.compile('Line 1\n\nLine 2');
			expect(result).toEqual([
				{ type: 'text', value: 'Line 1\n\nLine 2' }
			]);
		});

		it('returns empty array for empty content', () => {
			const result = compiler.compile('');
			expect(result).toEqual([]);
		});
	});

	describe('<<set>> macro', () => {
		it('compiles simple variable assignment', () => {
			const result = compiler.compile('<<set $name = "Alice">>');
			expect(result).toEqual([
				{
					type: 'set',
					variable: 'name',
					value: { type: 'literal', value: 'Alice' }
				}
			]);
		});

		it('compiles numeric assignment', () => {
			const result = compiler.compile('<<set $count = 42>>');
			expect(result[0]).toMatchObject({
				type: 'set',
				variable: 'count',
				value: { type: 'literal', value: 42 }
			});
		});

		it('compiles boolean assignment', () => {
			const result = compiler.compile('<<set $flag = true>>');
			expect(result[0]).toMatchObject({
				type: 'set',
				variable: 'flag',
				value: { type: 'literal', value: true }
			});
		});

		it('compiles expression assignment', () => {
			const result = compiler.compile('<<set $total = $count + 1>>');
			expect(result[0]).toMatchObject({
				type: 'set',
				variable: 'total',
				value: {
					type: 'binary',
					operator: '+',
					left: { type: 'var', name: 'count' },
					right: { type: 'literal', value: 1 }
				}
			});
		});

		it('throws on missing variable', () => {
			expect(() => compiler.compile('<<set = 5>>')).toThrow(MacroCompileError);
		});

		it('throws on missing equals sign', () => {
			expect(() => compiler.compile('<<set $x 5>>')).toThrow(MacroCompileError);
		});
	});

	describe('<<print>> macro', () => {
		it('compiles variable print', () => {
			const result = compiler.compile('<<print $name>>');
			expect(result).toEqual([
				{
					type: 'print',
					expression: { type: 'var', name: 'name' }
				}
			]);
		});

		it('compiles literal print', () => {
			const result = compiler.compile('<<print "Hello">>');
			expect(result[0]).toMatchObject({
				type: 'print',
				expression: { type: 'literal', value: 'Hello' }
			});
		});

		it('compiles expression print', () => {
			const result = compiler.compile('<<print $x + $y>>');
			expect(result[0]).toMatchObject({
				type: 'print',
				expression: {
					type: 'binary',
					operator: '+',
					left: { type: 'var', name: 'x' },
					right: { type: 'var', name: 'y' }
				}
			});
		});
	});

	describe('<<link>> macro', () => {
		it('compiles link with same text and passage', () => {
			const result = compiler.compile('<<link "Next">>');
			expect(result).toEqual([
				{
					type: 'link',
					text: 'Next',
					passage: 'Next'
				}
			]);
		});

		it('compiles link with different text and passage', () => {
			const result = compiler.compile('<<link "Continue" "Chapter2">>');
			expect(result[0]).toMatchObject({
				type: 'link',
				text: 'Continue',
				passage: 'Chapter2'
			});
		});
	});

	describe('<<if>> control flow', () => {
		it('compiles simple if block', () => {
			const result = compiler.compile('<<if $x>>yes<</if>>');
			expect(result).toEqual([
				{
					type: 'if',
					condition: { type: 'var', name: 'x' },
					then: [{ type: 'text', value: 'yes' }],
					elseifs: [],
					else: []
				}
			]);
		});

		it('compiles if-else block', () => {
			const result = compiler.compile('<<if $x>>yes<<else>>no<</if>>');
			expect(result[0]).toMatchObject({
				type: 'if',
				then: [{ type: 'text', value: 'yes' }],
				else: [{ type: 'text', value: 'no' }]
			});
		});

		it('compiles if-elseif-else block', () => {
			const result = compiler.compile('<<if $x == 1>>one<<elseif $x == 2>>two<<else>>other<</if>>');
			expect(result[0]).toMatchObject({
				type: 'if',
				then: [{ type: 'text', value: 'one' }],
				elseifs: [
					{
						condition: {
							type: 'binary',
							operator: '==',
							left: { type: 'var', name: 'x' },
							right: { type: 'literal', value: 1 }
						},
						body: [{ type: 'text', value: 'two' }]
					}
				],
				else: [{ type: 'text', value: 'other' }]
			});
		});

		it('compiles nested if blocks', () => {
			const result = compiler.compile('<<if $x>><<if $y>>nested<</if>><</if>>');
			expect(result[0].then[0]).toMatchObject({
				type: 'if',
				then: [{ type: 'text', value: 'nested' }]
			});
		});

		it('compiles macros inside if branches', () => {
			const result = compiler.compile('<<if $x>><<set $y = 1>><</if>>');
			expect(result[0].then[0]).toMatchObject({
				type: 'set',
				variable: 'y',
				value: { type: 'literal', value: 1 }
			});
		});

		it('throws on unclosed if', () => {
			expect(() => compiler.compile('<<if $x>>text')).toThrow(MacroCompileError);
		});

		it('throws on mismatched closing tag', () => {
			expect(() => compiler.compile('<<if $x>>text<</set>>')).toThrow(MacroCompileError);
		});

		it('throws on else without if', () => {
			expect(() => compiler.compile('<<else>>')).toThrow(MacroCompileError);
		});

		it('throws on elseif without if', () => {
			expect(() => compiler.compile('<<elseif $x>>')).toThrow(MacroCompileError);
		});
	});

	describe('Complex expressions', () => {
		it('compiles comparison operators', () => {
			const operators = ['==', '!=', '<', '>', '<=', '>='];
			operators.forEach(op => {
				const result = compiler.compile(`<<if $x ${op} 5>>text<</if>>`);
				expect(result[0].condition).toMatchObject({
					type: 'binary',
					operator: op,
					left: { type: 'var', name: 'x' },
					right: { type: 'literal', value: 5 }
				});
			});
		});

		it('compiles logical operators', () => {
			const result = compiler.compile('<<if $x && $y>>text<</if>>');
			expect(result[0].condition).toMatchObject({
				type: 'binary',
				operator: '&&',
				left: { type: 'var', name: 'x' },
				right: { type: 'var', name: 'y' }
			});
		});

		it('compiles arithmetic operators', () => {
			const result = compiler.compile('<<set $z = $x * $y>>');
			expect(result[0].value).toMatchObject({
				type: 'binary',
				operator: '*',
				left: { type: 'var', name: 'x' },
				right: { type: 'var', name: 'y' }
			});
		});
	});

	describe('Mixed content', () => {
		it('compiles text and macros interleaved', () => {
			const result = compiler.compile('Hello <<print $name>>, welcome!');
			expect(result).toEqual([
				{ type: 'text', value: 'Hello ' },
				{
					type: 'print',
					expression: { type: 'var', name: 'name' }
				},
				{ type: 'text', value: ', welcome!' }
			]);
		});

		it('optimizes adjacent text chunks', () => {
			const input = 'Text1';
			const result = compiler.compile(input);
			expect(result).toEqual([
				{ type: 'text', value: 'Text1' }
			]);
		});

		it('compiles complex real-world passage', () => {
			const input = `You see <<print $enemy>>.
<<if $weapon>>
You have a <<print $weapon>>.
<<link "Attack" "Combat">>
<<else>>
You are unarmed.
<<link "Flee" "Escape">>
<</if>>`;

			const result = compiler.compile(input);
			expect(result.length).toBeGreaterThan(0);
			expect(result.some(chunk => chunk.type === 'if')).toBe(true);
			expect(result.some(chunk => chunk.type === 'print')).toBe(true);
		});
	});

	describe('Error handling', () => {
		it('includes line and column in error', () => {
			try {
				compiler.compile('Line 1\n<<unknown>>');
				fail('Should have thrown');
			} catch (e) {
				expect(e).toBeInstanceOf(MacroCompileError);
				expect(e.line).toBeGreaterThan(0);
				expect(e.column).toBeGreaterThan(0);
			}
		});

		it('throws on unknown macro', () => {
			expect(() => compiler.compile('<<unknown>>')).toThrow(/Unknown macro/);
		});

		it('throws on empty macro', () => {
			expect(() => compiler.compile('<<>>')).toThrow(MacroCompileError);
		});
	});

	describe('Tokenization', () => {
		it('tokenizes strings with quotes', () => {
			const tokens = compiler.tokenize('set $x = "hello world"');
			expect(tokens).toContainEqual({ type: 'string', value: 'hello world' });
		});

		it('tokenizes numbers', () => {
			const tokens = compiler.tokenize('set $x = 42');
			expect(tokens).toContainEqual({ type: 'number', value: 42 });
		});

		it('tokenizes booleans', () => {
			const tokens = compiler.tokenize('set $x = true');
			expect(tokens).toContainEqual({ type: 'boolean', value: true });
		});

		it('tokenizes variables', () => {
			const tokens = compiler.tokenize('print $name');
			expect(tokens).toContainEqual({ type: 'variable', value: 'name' });
		});

		it('tokenizes operators', () => {
			const tokens = compiler.tokenize('$x == 5');
			expect(tokens).toContainEqual({ type: 'operator', value: '==' });
		});
	});
});
