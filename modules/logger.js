/*
	File: logger.js
	Revision number: 6
	License: GPL-3.0
	Copyleft (c) 2025-2026 ZhianTeam. All rights may not reserved.

	This is the output formatter for Usagi compiler.
	BandTwine is a FLOSS Software distributed under AGPL-3.0 license. This software comes with ABSOLUTELY NO WARRANTY.
	You are welcome to redistribute it under certain conditions. See the GNU Affero General Public License for more details.
*/

import { execSync } from 'node:child_process';
import { isatty } from 'node:tty';
import { enhanceMessage, expressSuccess } from './personality.js';

const ANSI = {
	reset: '\x1b[0m',
	bold: '\x1b[1m',
	dim: '\x1b[2m',

	blue: '\x1b[34m',
	green: '\x1b[32m',
	yellow: '\x1b[33m',
	red: '\x1b[31m',
	cyan: '\x1b[36m',

	blueBold: '\x1b[1;34m',
	greenBold: '\x1b[1;32m',
	yellowBold: '\x1b[1;33m',
	redBold: '\x1b[1;31m'
};

const NERD_SPINNER = ['', '', '', '', '', ''];
const BRAILLE_SPINNER = ['⠋', '⠙', '⠹', '⠸', '⠼', '⠴', '⠦', '⠧', '⠇', '⠏'];

const CUTE_ZH = {
	compiling: '正在编译',
	done: '完成啦',
	error: 'error',
	warning: 'warning',
	note: '才…才不会告诉你',
	failed: '× 编译中止。哼～',
	success: '✓ 编译成功！',
	bracket_missing: '诶…？这里是不是漏掉了一个 \'>\' 呀？右边空空的，逻辑要流出来啦……',
	bracket_hint: '在 Twee 故事中，<< 和 >> 是成对出现的哦。',
	unknown_node: '咦？遇到了不认识的节点欸……',
	unknown_node_hint: '这个节点不在 KDL schema 里面哦，可能是拼写错误，或者还没有实现呢～',
	invalid_value: '这个值……好像不太对劲？',
	invalid_value_hint: '检查一下类型、格式或者取值范围吧！',
	file_not_found: '找不到文件啦！是不是路径写错了呀？',
	parse_error: '解析失败了……文件格式可能有问题哦',
	validation_error: '验证没通过呢……',
	missing_required: '必需的字段不见了！',
	invalid_spdx: '这个许可证标识符……SPDX 数据库里没有欸',
	invalid_spdx_hint: '去 https://spdx.org/licenses/ 查一查正确的标识符吧～'
};

const C_LOCALE = {
	compiling: 'Compiling',
	done: 'Done',
	error: 'error',
	warning: 'warning',
	note: 'Note',
	failed: '× Compilation Failed. Stop.',
	success: '✓ Compilation Succeeded.',
	bracket_missing: 'Bracket isn\'t enclosed: expected \'>\' but got a line break',
	bracket_hint: 'In Twee stories, a `<<` is usually paired with `>>` in a single line.',
	unknown_node: 'Unknown node encountered',
	unknown_node_hint: 'This node is not in the KDL schema. Check for typos or unimplemented features.',
	invalid_value: 'Invalid value',
	invalid_value_hint: 'Check the type, format, or value range.',
	file_not_found: 'File not found',
	parse_error: 'Parse error',
	validation_error: 'Validation failed',
	missing_required: 'Required field missing',
	invalid_spdx: 'Invalid SPDX license identifier',
	invalid_spdx_hint: 'Check https://spdx.org/licenses/ for valid identifiers.'
};

class Logger {
	constructor(options = {}) {
		this.verbose = options.verbose || false;
		this.quiet = options.quiet || false;
		this.silent = options.silent || false;
		this.cLocale = options.cLocale || false;
		this.noColor = options.noColor || false;
		this.forceNerd = options.forceNerd || false;
		this.strict = options.strict || false;

		this.isCI = process.env.CI === 'true' || process.env.CONTINUOUS_INTEGRATION === 'true';
		this.isTTY = isatty(1);

		if (this.isCI) {
			this.cLocale = true;
		}

		if (!this.isTTY) {
			this.noColor = true;
		}

		this.hasNerdFont = this.forceNerd || this.detectNerdFont();
		this.spinner = this.hasNerdFont ? NERD_SPINNER : BRAILLE_SPINNER;
		this.spinnerIndex = 0;
		this.spinnerInterval = null;

		this.locale = this.cLocale ? C_LOCALE : CUTE_ZH;
	}

	detectNerdFont() {
		if (process.platform === 'win32') {
			return false;
		}

		try {
			const term = process.env.TERM || '';
			if (term.includes('linux') || term === 'dumb') {
				return false;
			}

			const termProgram = process.env.TERM_PROGRAM || '';
			if (termProgram.includes('vscode')) {
				return false;
			}

			let fontName = '';

			if (process.platform === 'linux') {
				try {
					const gnomeFont = execSync(
						'gsettings get org.gnome.desktop.interface monospace-font-name 2>/dev/null',
						{ encoding: 'utf8', timeout: 500 }
					).trim().replace(/'/g, '');
					fontName = gnomeFont;
				} catch {}

				if (!fontName) {
					try {
						const xresources = execSync('xrdb -query 2>/dev/null', {
							encoding: 'utf8',
							timeout: 500
						});
						const match = xresources.match(/\*font.*?:\s*(.+)/i);
						if (match) {
							fontName = match[1];
						}
					} catch {}
				}
			} else if (process.platform === 'darwin') {
				return true;
			}

			const nerdPatterns = [
				/nerd\s*font/i,
				/\bnf\b/i,
				/\bnfm\b/i,
				/\bnfp\b/i,
				/nerd\s*font\s*mono/i,
				/nerd\s*font\s*propo/i
			];

			return nerdPatterns.some(pattern => pattern.test(fontName));
		} catch {
			return false;
		}
	}

	color(text, colorCode) {
		if (this.noColor) {
			return text;
		}
		return `${colorCode}${text}${ANSI.reset}`;
	}

	marker(text, type = 'info') {
		if (this.silent) return;

		let colorCode = ANSI.blueBold;
		if (type === 'warning') {
			colorCode = ANSI.yellowBold;
		} else if (type === 'error') {
			colorCode = ANSI.redBold;
		}

		const prefix = this.color('::', colorCode);
		console.log(`${prefix} ${text}`);
	}

	step(text) {
		if (this.silent || this.quiet) return;

		const prefix = this.color('==>', ANSI.blueBold);
		console.log(`${prefix} ${text}`);
	}

	substep(text) {
		if (this.silent || this.quiet) return;
		if (!this.verbose) return;

		const prefix = this.color('	 -->', ANSI.greenBold);
		console.log(`${prefix} ${text}`);
	}

	info(text) {
		if (this.silent) return;

		const prefix = this.color('::', ANSI.blueBold);
		console.log(`${prefix} ${text}`);
	}

	warning(text, location = null) {
		if (this.silent) return;

		const enhanced = enhanceMessage(text, 'warning', this.cLocale);

		const prefix = this.color('::', ANSI.yellowBold);
		const label = this.color(`${this.locale.warning}:`, ANSI.yellowBold);

		if (location) {
			console.log(`${prefix} ${label} ${location}: ${enhanced}`);
		} else {
			console.log(`${prefix} ${label} ${enhanced}`);
		}
	}

	error(text, location = null) {
		const enhanced = enhanceMessage(text, 'error', this.cLocale);

		const prefix = this.color('::', ANSI.redBold);
		const label = this.color(`${this.locale.error}:`, ANSI.redBold);

		if (location) {
			console.error(`${prefix} ${label} ${location}: ${enhanced}`);
		} else {
			console.error(`${prefix} ${label} ${enhanced}`);
		}
	}

	errorWithContext(message, location, lineContent, column, hint = null) {
		this.error(message, location);

		if (this.verbose && lineContent) {
			const [file, line] = location.split(':');
			const lineNum = line || '?';
			const lineNumStr = String(lineNum).padStart(4);

			console.error(`	 ${lineNumStr} | ${lineContent}`);

			if (column) {
				const pointer = ' '.repeat(lineNumStr.length + 3 + (parseInt(column) - 1)) + '^';
				console.error(pointer);
			}

			if (hint) {
				const noteLabel = this.color(`${this.locale.note}:`, ANSI.cyan);
				console.error(`	 ${noteLabel} ${hint}`);
			}
		}
	}

	success(text) {
		if (this.silent) return;

		const message = text || (this.cLocale ? this.locale.success : expressSuccess());

		const symbol = this.hasNerdFont ? '󰄬' : '✓';
		console.log(`${this.color(symbol, ANSI.greenBold)} ${message}`);
	}

	fail(text, errno = 1) {
		const symbol = this.hasNerdFont ? '󰅖' : '×';
		const msg = text || this.locale.failed;
		console.error(`${this.color(symbol, ANSI.redBold)} ${msg} (errno ${errno})`);
	}

	startSpinner(text) {
		if (!this.silent) return;

		this.spinnerIndex = 0;
		this.spinnerText = text;
		this.spinnerPercent = 0;
		this.lastLoggedPercent = -1;

		if (this.isTTY) {
			process.stdout.write(`${this.spinner[0]} ${text} (0%)\r`);

			this.spinnerInterval = setInterval(() => {
				this.spinnerIndex = (this.spinnerIndex + 1) % this.spinner.length;
				const percentStr = Math.round(this.spinnerPercent).toString().padStart(2);
				process.stdout.write(`${this.spinner[this.spinnerIndex]} ${this.spinnerText} (${percentStr}%)\r`);
			}, 80);
		} else {
			console.log(`${text} (0%)...`);
			this.lastLoggedPercent = 0;
		}
	}

	updateSpinner(text, percent) {
		if (!this.silent) return;

		if (text) this.spinnerText = text;
		if (percent !== undefined) this.spinnerPercent = percent;

		if (!this.isTTY) {
			const roundedPercent = Math.round(percent);
			if (roundedPercent >= this.lastLoggedPercent + 10) {
				console.log(`${this.spinnerText} (${roundedPercent}%)...`);
				this.lastLoggedPercent = roundedPercent;
			}
		}
	}

	stopSpinner(text = null, success = true) {
		if (!this.silent) return;

		if (this.spinnerInterval) {
			clearInterval(this.spinnerInterval);
			this.spinnerInterval = null;
		}

		if (this.isTTY) {
			const symbol = success
				? (this.hasNerdFont ? '󰄬' : '✓')
				: (this.hasNerdFont ? '󰅖' : '×');
			const color = success ? ANSI.greenBold : ANSI.redBold;

			if (text) {
				process.stdout.write(`${this.color(symbol, color)} ${text}${' '.repeat(20)}\n`);
			} else {
				process.stdout.write('\n');
			}
		} else {
			const symbol = success ? '✓' : '×';
			if (text) {
				console.log(`${symbol} ${text}`);
			}
		}
	}

	clearLine() {
		if (!this.isTTY) return;
		process.stdout.write('\r\x1b[K');
	}

	t(key) {
		return this.locale[key] || key;
	}
}

export default Logger;
