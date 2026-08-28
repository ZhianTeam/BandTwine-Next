/*
	File: tweecomp/__tests__/parser.test.js
	Revision number: 1
	License: GPL-3.0
	Copyleft (c) 2025-2026 ZhianTeam. All rights may not reserved.

	Unit tests for Twee parser.
	BandTwine is a FLOSS Software distributed under GPL-3.0 license. This software comes with ABSOLUTELY NO WARRANTY.
	You are welcome to redistribute it under certain conditions. See the GNU General Public License for more details.
*/

import { describe, it } from 'node:test';
import assert from 'node:assert';
import { TweeParser } from '../src/parser.js';

describe('Twee Parser', () => {
	describe('Basic Passage Parsing', () => {
		it('should parse simple passage', () => {
			const source = ':: Start\nWelcome to the story.';
			const parser = new TweeParser(source);
			const result = parser.parse();

			assert.strictEqual(result.passages.length, 1);
			assert.strictEqual(result.passages[0].name, 'Start');
			assert.strictEqual(result.passages[0].content, 'Welcome to the story.');
		});

		it('should parse multiple passages', () => {
			const source = `
:: Start
First passage

:: Second
Second passage

:: Third
Third passage
			`;
			const parser = new TweeParser(source);
			const result = parser.parse();

			assert.strictEqual(result.passages.length, 3);
			assert.strictEqual(result.passages[0].name, 'Start');
			assert.strictEqual(result.passages[1].name, 'Second');
			assert.strictEqual(result.passages[2].name, 'Third');
		});

		it('should preserve passage content', () => {
			const source = `:: Test
Line 1
Line 2
Line 3`;
			const parser = new TweeParser(source);
			const result = parser.parse();

			assert.strictEqual(result.passages[0].content, 'Line 1\nLine 2\nLine 3');
		});
	});

	describe('Passage Metadata', () => {
		it('should parse tags', () => {
			const source = ':: Start [tag1 tag2 tag3]\nContent';
			const parser = new TweeParser(source);
			const result = parser.parse();

			assert.deepStrictEqual(result.passages[0].tags, ['tag1', 'tag2', 'tag3']);
		});

		it('should parse metadata', () => {
			const source = ':: Start {position: "100,200"}\nContent';
			const parser = new TweeParser(source);
			const result = parser.parse();

			assert.ok(result.passages[0].metadata);
		});

		it('should parse tags and metadata together', () => {
			const source = ':: Start [tag1 tag2] {position: "100,200"}\nContent';
			const parser = new TweeParser(source);
			const result = parser.parse();

			assert.deepStrictEqual(result.passages[0].tags, ['tag1', 'tag2']);
			assert.ok(result.passages[0].metadata);
		});

		it('should handle passages without tags or metadata', () => {
			const source = ':: Start\nContent';
			const parser = new TweeParser(source);
			const result = parser.parse();

			assert.deepStrictEqual(result.passages[0].tags, []);
			assert.deepStrictEqual(result.passages[0].metadata, {});
		});
	});

	describe('Passage Names', () => {
		it('should handle names with spaces', () => {
			const source = ':: The First Passage\nContent';
			const parser = new TweeParser(source);
			const result = parser.parse();

			assert.strictEqual(result.passages[0].name, 'The First Passage');
		});

		it('should handle names with special characters', () => {
			const source = ':: Passage-Name_123\nContent';
			const parser = new TweeParser(source);
			const result = parser.parse();

			assert.strictEqual(result.passages[0].name, 'Passage-Name_123');
		});

		it('should trim whitespace from names', () => {
			const source = '::	 Start	 \nContent';
			const parser = new TweeParser(source);
			const result = parser.parse();

			assert.strictEqual(result.passages[0].name, 'Start');
		});
	});

	describe('Links', () => {
		it('should preserve link syntax', () => {
			const source = ':: Start\n[[Next Passage]]';
			const parser = new TweeParser(source);
			const result = parser.parse();

			assert.ok(result.passages[0].content.includes('[[Next Passage]]'));
		});

		it('should preserve link with display text', () => {
			const source = ':: Start\n[[Go to next|Next]]';
			const parser = new TweeParser(source);
			const result = parser.parse();

			assert.ok(result.passages[0].content.includes('[[Go to next|Next]]'));
		});

		it('should preserve multiple links', () => {
			const source = ':: Start\n[[Option 1]]\n[[Option 2]]\n[[Option 3]]';
			const parser = new TweeParser(source);
			const result = parser.parse();

			const content = result.passages[0].content;
			assert.ok(content.includes('[[Option 1]]'));
			assert.ok(content.includes('[[Option 2]]'));
			assert.ok(content.includes('[[Option 3]]'));
		});
	});

	describe('Macros', () => {
		it('should preserve <<set>> macros', () => {
			const source = ':: Start\n<<set $health = 100>>';
			const parser = new TweeParser(source);
			const result = parser.parse();

			assert.ok(result.passages[0].content.includes('<<set $health = 100>>'));
		});

		it('should preserve <<if>> macros', () => {
			const source = ':: Start\n<<if $health > 0>>\nYou are alive\n<</if>>';
			const parser = new TweeParser(source);
			const result = parser.parse();

			assert.ok(result.passages[0].content.includes('<<if $health > 0>>'));
		});

		it('should preserve multiple macros', () => {
			const source = ':: Start\n<<set $x = 1>>\n<<print $x>>\n<<if true>>Test<</if>>';
			const parser = new TweeParser(source);
			const result = parser.parse();

			const content = result.passages[0].content;
			assert.ok(content.includes('<<set $x = 1>>'));
			assert.ok(content.includes('<<print $x>>'));
			assert.ok(content.includes('<<if true>>'));
		});
	});

	describe('Empty Passages', () => {
		it('should handle passage with no content', () => {
			const source = ':: Empty\n\n:: Next\nContent';
			const parser = new TweeParser(source);
			const result = parser.parse();

			assert.strictEqual(result.passages[0].content, '');
			assert.strictEqual(result.passages[1].content, 'Content');
		});

		it('should handle passage with only whitespace', () => {
			const source = ':: Whitespace\n		\n\t\n';
			const parser = new TweeParser(source);
			const result = parser.parse();

			assert.strictEqual(result.passages[0].content.trim(), '');
		});
	});

	describe('Edge Cases', () => {
		it('should handle empty document', () => {
			const source = '';
			const parser = new TweeParser(source);
			const result = parser.parse();

			assert.strictEqual(result.passages.length, 0);
		});

		it('should handle document with no passages', () => {
			const source = 'This is not a passage\nJust some text';
			const parser = new TweeParser(source);
			const result = parser.parse();

			assert.strictEqual(result.passages.length, 0);
		});

		it('should ignore text before first passage', () => {
			const source = `
Ignored text
More ignored
:: Start
Actual content
			`;
			const parser = new TweeParser(source);
			const result = parser.parse();

			assert.strictEqual(result.passages.length, 1);
			assert.strictEqual(result.passages[0].name, 'Start');
		});

		it('should handle :: in content', () => {
			const source = `
:: Start
This is :: not a passage header
It's just content
			`;
			const parser = new TweeParser(source);
			const result = parser.parse();

			assert.strictEqual(result.passages.length, 1);
			assert.ok(result.passages[0].content.includes('::'));
		});
	});

	describe('Line Numbers', () => {
		it('should track passage line numbers', () => {
			const source = `
:: Start
Content

:: Second
More content
			`;
			const parser = new TweeParser(source);
			const result = parser.parse();

			assert.strictEqual(result.passages[0].line, 2);
			assert.strictEqual(result.passages[1].line, 5);
		});
	});

	describe('Special Passages', () => {
		it('should parse StoryTitle passage', () => {
			const source = ':: StoryTitle\nMy Story';
			const parser = new TweeParser(source);
			const result = parser.parse();

			assert.strictEqual(result.passages[0].name, 'StoryTitle');
		});

		it('should parse StoryData passage', () => {
			const source = ':: StoryData\n{"ifid": "12345"}';
			const parser = new TweeParser(source);
			const result = parser.parse();

			assert.strictEqual(result.passages[0].name, 'StoryData');
		});

		it('should parse script-tagged passages', () => {
			const source = ':: JavaScript [script]\nconst x = 42;';
			const parser = new TweeParser(source);
			const result = parser.parse();

			assert.ok(result.passages[0].tags.includes('script'));
		});
	});

	describe('Content Preservation', () => {
		it('should preserve blank lines in content', () => {
			const source = `:: Start
Line 1

Line 2

Line 3`;
			const parser = new TweeParser(source);
			const result = parser.parse();

			const lines = result.passages[0].content.split('\n');
			assert.strictEqual(lines.length, 5);
		});

		it('should preserve indentation', () => {
			const source = `:: Start
No indent
\tOne tab
\t\tTwo tabs`;
			const parser = new TweeParser(source);
			const result = parser.parse();

			assert.ok(result.passages[0].content.includes('\t'));
		});

		it('should preserve special characters', () => {
			const source = ':: Start\n<>&"\'\\/@#$%^&*()';
			const parser = new TweeParser(source);
			const result = parser.parse();

			assert.ok(result.passages[0].content.includes('<>&"\''));
		});
	});

	describe('Passage Count', () => {
		it('should return correct passage count', () => {
			const source = `
:: One
:: Two
:: Three
:: Four
:: Five
			`;
			const parser = new TweeParser(source);
			const result = parser.parse();

			assert.strictEqual(result.passageCount, 5);
		});
	});

	describe('Complex Stories', () => {
		it('should parse complete story', () => {
			const source = `
:: StoryTitle
Test Story

:: Start [start]
Welcome! Your health is <<print $health>>.

[[Continue|Next]]

:: Next {position: "100,200"}
<<set $health -= 10>>
You lost 10 health!

<<if $health > 0>>
[[Go back|Start]]
<<else>>
[[Game Over]]
<</if>>

:: Game Over [ending]
You died.
			`;
			const parser = new TweeParser(source);
			const result = parser.parse();

			assert.strictEqual(result.passages.length, 4);
			assert.strictEqual(result.passages[0].name, 'StoryTitle');
			assert.strictEqual(result.passages[1].name, 'Start');
			assert.ok(result.passages[1].tags.includes('start'));
			assert.strictEqual(result.passages[2].name, 'Next');
			assert.strictEqual(result.passages[3].name, 'Game Over');
		});
	});

	describe('Error Cases', () => {
		it('should throw on invalid passage header', () => {
			const source = ':: \nNo name';
			const parser = new TweeParser(source);

			assert.throws(() => {
				parser.parse();
			}, /Invalid passage header/);
		});
	});
});
