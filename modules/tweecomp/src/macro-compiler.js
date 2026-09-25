/*
	File: tweecomp/src/macro-compiler.js
	Revision number: 1
	License: GPL-3.0
	Copyleft (c) 2025-2026 ZhianTeam. All rights may not reserved.

	This is the macro compiler for BandTwine Next Twee compiler.
	BandTwine is a FLOSS Software distributed under AGPL-3.0 license. This software comes with ABSOLUTELY NO WARRANTY.
	You are welcome to redistribute it under certain conditions. See the GNU Affero General Public License for more details.
*/

export class MacroCompileError extends Error {
	constructor(message, line, column, macro) {
		super(message);
		this.name = 'MacroCompileError';
		this.line = line;
		this.column = column;
		this.macro = macro;
	}
}

/*
	MacroCompiler transforms SugarCube-style macros into structured AST.
	Supports core macro set: if/elseif/else, set, print, link
	Output format designed for compact binary encoding and fast runtime execution.
*/
export class MacroCompiler {
	constructor() {
		this.controlFlow = new Set(['if', 'elseif', 'else']);
		this.standalone = new Set(['set', 'print', 'link', 'button']);
		this.allMacros = new Set([...this.controlFlow, ...this.standalone]);
	}

	compile(content, passageName = 'unknown') {
		const chunks = [];
		let pos = 0;
		let match;
		const stack = [];
		let lineNum = 1;

		let i = 0;
		while (i < content.length) {
			const start = content.indexOf('<<', i);
			if (start === -1) break;

			if (start > i) {
				const textContent = content.substring(i, start);
				const textChunk = {
					type: 'text',
					value: textContent
				};

				if (stack.length > 0) {
					const parent = stack[stack.length - 1];
					if (parent.name === 'if') {
						const ifNode = parent.node;
						if (ifNode.currentBranch === 'then') {
							ifNode.then.push(textChunk);
						} else if (ifNode.currentBranch === 'elseif') {
							ifNode.currentElseif.body.push(textChunk);
						} else if (ifNode.currentBranch === 'else') {
							ifNode.else.push(textChunk);
						}
					}
				} else {
					chunks.push(textChunk);
				}

				lineNum += (textContent.match(/\n/g) || []).length;
			}

			const end = content.indexOf('>>', start + 2);
			if (end === -1) {
				throw new MacroCompileError(
					'Unclosed macro delimiter',
					lineNum,
					this.getColumn(content, start),
					''
				);
			}

			const macroText = content.substring(start + 2, end).trim();
			const column = this.getColumn(content, start);

			if (macroText.startsWith('/')) {
				const closeName = macroText.substring(1).trim();
				if (stack.length === 0) {
					throw new MacroCompileError(
						`Unexpected closing macro <</${closeName}>> without matching opening`,
						lineNum,
						column,
						closeName
					);
				}

				const top = stack[stack.length - 1];
				if (top.name !== closeName) {
					throw new MacroCompileError(
						`Mismatched closing macro: expected <</${top.name}>>, got <</${closeName}>>`,
						lineNum,
						column,
						closeName
					);
				}

				if (top.name === 'if') {
					delete top.node.currentBranch;
					delete top.node.currentElseif;
				}

				stack.pop();
			} else {
				const parsed = this.parseMacro(macroText, lineNum, column, passageName);

				if (parsed.type === 'if') {
					parsed.then = [];
					parsed.elseifs = [];
					parsed.else = [];
					parsed.currentBranch = 'then';
					stack.push({ name: 'if', node: parsed });

					if (stack.length > 1) {
						const parent = stack[stack.length - 2];
						if (parent.name === 'if') {
							const parentIfNode = parent.node;
							if (parentIfNode.currentBranch === 'then') {
								parentIfNode.then.push(parsed);
							} else if (parentIfNode.currentBranch === 'elseif') {
								parentIfNode.currentElseif.body.push(parsed);
							} else if (parentIfNode.currentBranch === 'else') {
								parentIfNode.else.push(parsed);
							}
						}
					} else {
						chunks.push(parsed);
					}
				} else if (parsed.type === 'elseif') {
					if (stack.length === 0 || stack[stack.length - 1].name !== 'if') {
						throw new MacroCompileError(
							'<<elseif>> must be inside <<if>> block',
							lineNum,
							column,
							'elseif'
						);
					}
					const ifNode = stack[stack.length - 1].node;
					const elseifBranch = {
						condition: parsed.condition,
						body: []
					};
					ifNode.elseifs.push(elseifBranch);
					ifNode.currentBranch = 'elseif';
					ifNode.currentElseif = elseifBranch;
				} else if (parsed.type === 'else') {
					if (stack.length === 0 || stack[stack.length - 1].name !== 'if') {
						throw new MacroCompileError(
							'<<else>> must be inside <<if>> block',
							lineNum,
							column,
							'else'
						);
					}
					const ifNode = stack[stack.length - 1].node;
					ifNode.currentBranch = 'else';
				} else {
					if (stack.length > 0) {
						const parent = stack[stack.length - 1];
						if (parent.name === 'if') {
							const ifNode = parent.node;
							if (ifNode.currentBranch === 'then') {
								ifNode.then.push(parsed);
							} else if (ifNode.currentBranch === 'elseif') {
								ifNode.currentElseif.body.push(parsed);
							} else if (ifNode.currentBranch === 'else') {
								ifNode.else.push(parsed);
							}
						}
					} else {
						chunks.push(parsed);
					}
				}
			}

			i = end + 2;
		}

		if (stack.length > 0) {
			const unclosed = stack[stack.length - 1];
			throw new MacroCompileError(
				`Unclosed macro <<${unclosed.name}>>`,
				lineNum,
				1,
				unclosed.name
			);
		}

		if (i < content.length) {
			const textChunk = {
				type: 'text',
				value: content.substring(i)
			};

			if (stack.length > 0) {
				const parent = stack[stack.length - 1];
				if (parent.name === 'if') {
					const ifNode = parent.node;
					if (ifNode.currentBranch === 'then') {
						ifNode.then.push(textChunk);
					} else if (ifNode.currentBranch === 'elseif') {
						ifNode.currentElseif.body.push(textChunk);
					} else if (ifNode.currentBranch === 'else') {
						ifNode.else.push(textChunk);
					}
				}
			} else {
				chunks.push(textChunk);
			}
		}

		return this.optimize(chunks);
	}

	parseMacro(text, line, column, passageName) {
		const tokens = this.tokenize(text);
		if (tokens.length === 0) {
			throw new MacroCompileError('Empty macro', line, column, '');
		}

		const macroName = tokens[0].value;

		if (!this.allMacros.has(macroName)) {
			throw new MacroCompileError(
				`Unknown macro: ${macroName}`,
				line,
				column,
				macroName
			);
		}

		switch (macroName) {
			case 'if':
				return this.parseIf(tokens, line, column);
			case 'elseif':
				return this.parseElseif(tokens, line, column);
			case 'else':
				return { type: 'else' };
			case 'set':
				return this.parseSet(tokens, line, column);
			case 'print':
				return this.parsePrint(tokens, line, column);
			case 'link':
				return this.parseLink(tokens, line, column);
			case 'button':
				return this.parseButton(tokens, line, column);
			default:
				throw new MacroCompileError(
					`Unsupported macro: ${macroName}`,
					line,
					column,
					macroName
				);
		}
	}

	tokenize(text) {
		const tokens = [];
		let i = 0;
		let current = '';
		let inString = false;
		let stringChar = null;

		while (i < text.length) {
			const ch = text[i];

			if (inString) {
				if (ch === stringChar && text[i - 1] !== '\\') {
					tokens.push({ type: 'string', value: current });
					current = '';
					inString = false;
					stringChar = null;
				} else {
					current += ch;
				}
			} else {
				if (ch === '"' || ch === "'") {
					if (current.trim()) {
						tokens.push({ type: 'identifier', value: current.trim() });
						current = '';
					}
					inString = true;
					stringChar = ch;
				} else if (/\s/.test(ch)) {
					if (current.trim()) {
						tokens.push(this.classifyToken(current.trim()));
						current = '';
					}
				} else if ('=<>!&|+-*/%()'.includes(ch)) {
					if (current.trim()) {
						tokens.push(this.classifyToken(current.trim()));
						current = '';
					}
					if (i + 1 < text.length) {
						const next = text[i + 1];
						if (
							(ch === '=' && next === '=') ||
							(ch === '!' && next === '=') ||
							(ch === '<' && next === '=') ||
							(ch === '>' && next === '=') ||
							(ch === '&' && next === '&') ||
							(ch === '|' && next === '|')
						) {
							tokens.push({ type: 'operator', value: ch + next });
							i++;
							i++;
							continue;
						}
					}
					tokens.push({ type: 'operator', value: ch });
				} else {
					current += ch;
				}
			}
			i++;
		}

		if (current.trim()) {
			tokens.push(this.classifyToken(current.trim()));
		}

		return tokens;
	}

	classifyToken(value) {
		if (value.startsWith('$')) {
			return { type: 'variable', value: value.substring(1) };
		}
		if (/^-?\d+$/.test(value)) {
			return { type: 'number', value: parseInt(value, 10) };
		}
		if (/^-?\d+\.\d+$/.test(value)) {
			return { type: 'number', value: parseFloat(value) };
		}
		if (value === 'true' || value === 'false') {
			return { type: 'boolean', value: value === 'true' };
		}
		return { type: 'identifier', value };
	}

	parseIf(tokens, line, column) {
		if (tokens.length < 2) {
			throw new MacroCompileError('<<if>> requires condition', line, column, 'if');
		}
		return {
			type: 'if',
			condition: this.parseExpression(tokens.slice(1), line, column)
		};
	}

	parseElseif(tokens, line, column) {
		if (tokens.length < 2) {
			throw new MacroCompileError('<<elseif>> requires condition', line, column, 'elseif');
		}
		return {
			type: 'elseif',
			condition: this.parseExpression(tokens.slice(1), line, column)
		};
	}

	parseSet(tokens, line, column) {
		if (tokens.length < 4) {
			throw new MacroCompileError('<<set>> requires variable and value', line, column, 'set');
		}

		if (tokens[1].type !== 'variable') {
			throw new MacroCompileError('<<set>> requires variable name', line, column, 'set');
		}

		const varName = tokens[1].value;

		if (tokens[2].type !== 'operator' || tokens[2].value !== '=') {
			throw new MacroCompileError('<<set>> requires = operator', line, column, 'set');
		}

		const valueTokens = tokens.slice(3);
		const value = this.parseExpression(valueTokens, line, column);

		return {
			type: 'set',
			variable: varName,
			value
		};
	}

	parsePrint(tokens, line, column) {
		if (tokens.length < 2) {
			throw new MacroCompileError('<<print>> requires expression', line, column, 'print');
		}
		return {
			type: 'print',
			expression: this.parseExpression(tokens.slice(1), line, column)
		};
	}

	parseLink(tokens, line, column) {
		if (tokens.length < 2) {
			throw new MacroCompileError('<<link>> requires passage name', line, column, 'link');
		}

		const text = tokens[1].type === 'string' ? tokens[1].value : tokens[1].value;
		let passage = text;

		if (tokens.length >= 3) {
			passage = tokens[2].type === 'string' ? tokens[2].value : tokens[2].value;
		}

		return {
			type: 'link',
			text,
			passage
		};
	}

	parseButton(tokens, line, column) {
		if (tokens.length < 2) {
			throw new MacroCompileError('<<button>> requires passage name', line, column, 'button');
		}

		const text = tokens[1].type === 'string' ? tokens[1].value : tokens[1].value;
		let passage = text;

		if (tokens.length >= 3) {
			passage = tokens[2].type === 'string' ? tokens[2].value : tokens[2].value;
		}

		return {
			type: 'button',
			text,
			passage
		};
	}

	parseExpression(tokens, line, column) {
		if (tokens.length === 0) {
			throw new MacroCompileError('Empty expression', line, column, '');
		}

		if (tokens.length === 1) {
			const token = tokens[0];
			if (token.type === 'variable') {
				return { type: 'var', name: token.value };
			}
			if (token.type === 'number') {
				return { type: 'literal', value: token.value };
			}
			if (token.type === 'boolean') {
				return { type: 'literal', value: token.value };
			}
			if (token.type === 'string') {
				return { type: 'literal', value: token.value };
			}
			return { type: 'literal', value: token.value };
		}

		for (let i = 0; i < tokens.length; i++) {
			const token = tokens[i];
			if (token.type === 'operator' && this.isBinaryOp(token.value)) {
				const left = this.parseExpression(tokens.slice(0, i), line, column);
				const right = this.parseExpression(tokens.slice(i + 1), line, column);
				return {
					type: 'binary',
					operator: token.value,
					left,
					right
				};
			}
		}

		throw new MacroCompileError('Invalid expression', line, column, '');
	}

	isBinaryOp(op) {
		return ['==', '!=', '<', '>', '<=', '>=', '&&', '||', '+', '-', '*', '/', '%'].includes(op);
	}

	optimize(chunks) {
		const optimized = [];

		for (let i = 0; i < chunks.length; i++) {
			const chunk = chunks[i];

			if (chunk.type === 'text') {
				if (i > 0 && optimized[optimized.length - 1].type === 'text') {
					optimized[optimized.length - 1].value += chunk.value;
				} else if (chunk.value.length > 0) {
					optimized.push(chunk);
				}
			} else {
				optimized.push(chunk);
			}
		}

		return optimized;
	}

	getColumn(content, index) {
		let col = 1;
		for (let i = index - 1; i >= 0; i--) {
			if (content[i] === '\n') break;
			col++;
		}
		return col;
	}
}
