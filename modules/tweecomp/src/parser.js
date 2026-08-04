/*
  File: src/parser.js
  Revision number: 1
  License: GPL-3.0
  Copyleft (c) 2025-2026 ZhianTeam. All rights may not reserved.

  This is the Twee parser for BandTwine Next.
  BandTwine is a FLOSS Software distributed under AGPL-3.0 license. This software comes with ABSOLUTELY NO WARRANTY.
  You are welcome to redistribute it under certain conditions. See the GNU Affero General Public License for more details.
*/

export class TweeParseError extends Error {
	constructor(message, line, column, filename) {
		super(message);
		this.name = 'TweeParseError';
		this.line = line;
		this.column = column;
		this.filename = filename;
	}
}

export class TweeParser {
	constructor(source, filename = 'story.twee') {
		this.source = source;
		this.filename = filename;
		this.passages = [];
	}

	parse() {
		const lines = this.source.split('\n');
		let currentPassage = null;
		let currentContent = [];
		let lineNum = 0;

		for (const line of lines) {
			lineNum++;

			if (line.trim().startsWith('::')) {
				if (currentPassage) {
					currentPassage.content = currentContent.join('\n').trim();
					this.passages.push(currentPassage);
					currentContent = [];
				}

				const headerMatch = line.match(/^::\s*(.+?)(?:\s*\[(.+?)\])?\s*(?:\{(.+?)\})?\s*$/);

				if (!headerMatch) {
					throw new TweeParseError(
						'Invalid passage header format',
						lineNum,
						1,
						this.filename
					);
				}

				const [, name, tags, metadata] = headerMatch;

				currentPassage = {
					name: name.trim(),
					tags: tags ? tags.split(/\s+/).filter(t => t) : [],
					metadata: metadata ? this.parseMetadata(metadata) : {},
					content: '',
					line: lineNum
				};
			} else if (currentPassage) {
				currentContent.push(line);
			}
		}

		if (currentPassage) {
			currentPassage.content = currentContent.join('\n').trim();
			this.passages.push(currentPassage);
		}

		return {
			passages: this.passages,
			passageCount: this.passages.length
		};
	}

	parseMetadata(metaStr) {
		const metadata = {};
		const pairs = metaStr.split(',');

		for (const pair of pairs) {
			const [key, value] = pair.split(':').map(s => s.trim());
			if (key) {
				metadata[key] = value || true;
			}
		}

		return metadata;
	}

	static validateMacros(content, filename, passageName, startLine) {
		const errors = [];
		const lines = content.split('\n');
		let lineNum = startLine;

		for (const line of lines) {
			lineNum++;

			let depth = 0;
			let i = 0;
			let lastOpenPos = -1;

			while (i < line.length) {
				if (i < line.length - 1 && line[i] === '<' && line[i + 1] === '<') {
					depth++;
					if (lastOpenPos === -1) {
						lastOpenPos = i;
					}
					i += 2;
				} else if (i < line.length - 1 && line[i] === '>' && line[i + 1] === '>') {
					depth--;
					i += 2;
				} else {
					i++;
				}
			}

			if (depth !== 0) {
				const column = lastOpenPos >= 0 ? lastOpenPos + 1 : 1;
				errors.push({
					message: '诶…？这里是不是漏掉了一个 \'>\' 呀？右边空空的，逻辑要流出来啦……',
					cMessage: 'Bracket isn\'t enclosed: expected \'>\' but got a line break',
					line: lineNum,
					column,
					filename,
					passageName,
					lineContent: line.trim(),
					hint: '在 Twee 故事中，<< 和 >> 是成对出现的哦。',
					cHint: 'In Twee stories, a `<<` is usually paired with `>>` in a single line.'
				});
			}
		}

		return errors;
	}
}
