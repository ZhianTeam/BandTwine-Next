#!/usr/bin/env node
/*
	File: tweecomp/__tests__/run-tests.js
	Revision number: 1
	License: GPL-3.0
	Copyleft (c) 2025-2026 ZhianTeam. All rights may not reserved.

	Simple test runner for macro compiler.
	BandTwine is a FLOSS Software distributed under AGPL-3.0 license. This software comes with ABSOLUTELY NO WARRANTY.
	You are welcome to redistribute it under certain conditions. See the GNU Affero General Public License for more details.
*/

import { MacroCompiler, MacroCompileError } from '../src/macro-compiler.js';

let passed = 0;
let failed = 0;

function test(name, fn) {
	try {
		fn();
		console.log(`✓ ${name}`);
		passed++;
	} catch (e) {
		console.error(`✗ ${name}`);
		console.error(`	 ${e.message}`);
		failed++;
	}
}

function assert(condition, message) {
	if (!condition) {
		throw new Error(message || 'Assertion failed');
	}
}

function assertThrows(fn, message) {
	try {
		fn();
		throw new Error(message || 'Expected function to throw');
	} catch (e) {
		if (e.message === message) {
			throw e;
		}
	}
}

const compiler = new MacroCompiler();

console.log('Running macro compiler tests...\n');

test('Plain text without macros', () => {
	const result = compiler.compile('Hello world!');
	assert(result.length === 1, 'Should have 1 chunk');
	assert(result[0].type === 'text', 'Should be text type');
	assert(result[0].value === 'Hello world!', 'Should preserve text');
});

test('Empty content', () => {
	const result = compiler.compile('');
	assert(result.length === 0, 'Should return empty array');
});

test('Simple <<set>> macro', () => {
	const result = compiler.compile('<<set $name = "Alice">>');
	assert(result.length === 1, 'Should have 1 chunk');
	assert(result[0].type === 'set', 'Should be set type');
	assert(result[0].variable === 'name', 'Should extract variable name');
	assert(result[0].value.type === 'literal', 'Should have literal value');
	assert(result[0].value.value === 'Alice', 'Should extract string value');
});

test('<<set>> with number', () => {
	const result = compiler.compile('<<set $count = 42>>');
	assert(result[0].type === 'set', 'Should be set type');
	assert(result[0].value.value === 42, 'Should parse number');
});

test('<<set>> with boolean', () => {
	const result = compiler.compile('<<set $flag = true>>');
	assert(result[0].value.value === true, 'Should parse boolean');
});

test('<<set>> with expression', () => {
	const result = compiler.compile('<<set $total = $count + 1>>');
	assert(result[0].value.type === 'binary', 'Should be binary expression');
	assert(result[0].value.operator === '+', 'Should extract operator');
	assert(result[0].value.left.type === 'var', 'Left should be variable');
	assert(result[0].value.right.type === 'literal', 'Right should be literal');
});

test('<<print>> macro', () => {
	const result = compiler.compile('<<print $name>>');
	assert(result[0].type === 'print', 'Should be print type');
	assert(result[0].expression.type === 'var', 'Should have variable expression');
	assert(result[0].expression.name === 'name', 'Should extract variable name');
});

test('<<link>> macro', () => {
	const result = compiler.compile('<<link "Next">>');
	assert(result[0].type === 'link', 'Should be link type');
	assert(result[0].text === 'Next', 'Should extract text');
	assert(result[0].passage === 'Next', 'Should default passage to text');
});

test('<<link>> with different passage', () => {
	const result = compiler.compile('<<link "Continue" "Chapter2">>');
	assert(result[0].text === 'Continue', 'Should extract text');
	assert(result[0].passage === 'Chapter2', 'Should extract passage');
});

test('Simple <<if>> block', () => {
	const result = compiler.compile('<<if $x>>yes<</if>>');
	assert(result[0].type === 'if', 'Should be if type');
	assert(result[0].condition.type === 'var', 'Should have condition');
	assert(result[0].then.length === 1, 'Should have then branch');
	assert(result[0].then[0].type === 'text', 'Then should contain text');
	assert(result[0].then[0].value === 'yes', 'Then should have correct text');
});

test('<<if-else>> block', () => {
	const result = compiler.compile('<<if $x>>yes<<else>>no<</if>>');
	assert(result[0].then[0].value === 'yes', 'Then branch should be correct');
	assert(result[0].else[0].value === 'no', 'Else branch should be correct');
});

test('<<if-elseif-else>> block', () => {
	const result = compiler.compile('<<if $x == 1>>one<<elseif $x == 2>>two<<else>>other<</if>>');
	assert(result[0].then[0].value === 'one', 'Then branch correct');
	assert(result[0].elseifs.length === 1, 'Should have 1 elseif');
	assert(result[0].elseifs[0].body[0].value === 'two', 'Elseif branch correct');
	assert(result[0].else[0].value === 'other', 'Else branch correct');
});

test('Nested <<if>> blocks', () => {
	const result = compiler.compile('<<if $x>><<if $y>>nested<</if>><</if>>');
	assert(result[0].then[0].type === 'if', 'Then should contain if');
	assert(result[0].then[0].then[0].value === 'nested', 'Nested if correct');
});

test('Macros inside if branches', () => {
	const result = compiler.compile('<<if $x>><<set $y = 1>><</if>>');
	assert(result[0].then[0].type === 'set', 'Then should contain set macro');
	assert(result[0].then[0].variable === 'y', 'Set variable correct');
});

test('Mixed text and macros', () => {
	const result = compiler.compile('Hello <<print $name>>, welcome!');
	assert(result.length === 3, 'Should have 3 chunks');
	assert(result[0].type === 'text', 'First should be text');
	assert(result[1].type === 'print', 'Second should be print');
	assert(result[2].type === 'text', 'Third should be text');
});

test('Comparison operators', () => {
	const operators = ['==', '!=', '<', '>', '<=', '>='];
	operators.forEach(op => {
		const result = compiler.compile(`<<if $x ${op} 5>>text<</if>>`);
		assert(result[0].condition.operator === op, `Should parse ${op} operator`);
	});
});

test('Logical operators', () => {
	const result = compiler.compile('<<if $x && $y>>text<</if>>');
	assert(result[0].condition.operator === '&&', 'Should parse && operator');
});

test('Error: Unknown macro', () => {
	assertThrows(() => compiler.compile('<<unknown>>'), 'Should throw on unknown macro');
});

test('Error: Unclosed if', () => {
	assertThrows(() => compiler.compile('<<if $x>>text'), 'Should throw on unclosed if');
});

test('Error: Mismatched closing tag', () => {
	assertThrows(() => compiler.compile('<<if $x>>text<</set>>'), 'Should throw on mismatched tag');
});

test('Error: else without if', () => {
	assertThrows(() => compiler.compile('<<else>>'), 'Should throw on else without if');
});

test('Error: Missing variable in set', () => {
	assertThrows(() => compiler.compile('<<set = 5>>'), 'Should throw on missing variable');
});

console.log(`\n${passed} passed, ${failed} failed`);
process.exit(failed > 0 ? 1 : 0);
