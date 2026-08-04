/*
  File: logger.js
  Revision number: 1
  License: GPL-3.0
  Copyleft (c) 2025-2026 ZhianTeam. All rights may not reserved.

  This is the output formatter for Usagi compiler.
  BandTwine is a FLOSS Software distributed under AGPL-3.0 license. This software comes with ABSOLUTELY NO WARRANTY.
  You are welcome to redistribute it under certain conditions. See the GNU Affero General Public License for more details.
*/

import { execSync } from 'node:child_process';
import { isatty } from 'node:tty';

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

const NERD_SPINNER = ['󰪞', '󰪟', '󰪠', '󰪡', '󰪢', '󰪣', '󰪤', '󰪥'];
const BRAILLE_SPINNER = ['⠋', '⠙', '⠹', '⠸', '⠼', '⠴', '⠦', '⠧', '⠇', '⠏'];

const CUTE_ZH = {
	compiling: '正在编译',
	done: '完成啦',
	error: '错误',
	warning: '警告',
	note: '才…才不会告诉你',
	failed: '× 编译中止。哼～',
	success: '✓ 编译成功！',
	bracket_missing: '诶…？这里是不是漏掉了一个 \'>\' 呀？右边空空的，逻辑要流出来啦……',
	bracket_hint: '在 Twee 故事中，<< 和 >> 是成对出现的哦。'
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
	bracket_hint: 'In Twee stories, a `<<` is usually paired with `>>` in a single line.'
};

class Logger {
	constructor(options = {}) {
		this.verbose = options.verbose || false;
		this.quiet = options.quiet || false;
		this.silent = options.silent || false;
		this.cLocale = options.cLocale || false;
		this.noColor = options.noColor || false;
		this.forceNerd = options.forceNerd || false;

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

		const prefix = this.color('  -->', ANSI.greenBold);
		console.log(`${prefix} ${text}`);
	}

	info(text) {
		if (this.silent) return;

		const prefix = this.color('::', ANSI.blueBold);
		console.log(`${prefix} ${text}`);
	}

	warning(text, location = null) {
		if (this.silent) return;

		const prefix = this.color('::', ANSI.blueBold);
		const label = this.color(`${this.locale.warning}:`, ANSI.yellowBold);

		if (location) {
			console.log(`${prefix} ${label} ${location}: ${text}`);
		} else {
			console.log(`${prefix} ${label} ${text}`);
		}
	}

	error(text, location = null) {
		const prefix = this.color('::', ANSI.blueBold);
		const label = this.color(`${this.locale.error}:`, ANSI.redBold);

		if (location) {
			console.error(`${prefix} ${label} ${location}: ${text}`);
		} else {
			console.error(`${prefix} ${label} ${text}`);
		}
	}

	errorWithContext(message, location, lineContent, column, hint = null) {
		this.error(message, location);

		if (this.verbose && lineContent) {
			const [file, line] = location.split(':');
			const lineNum = line || '?';
			const lineNumStr = String(lineNum).padStart(4);

			console.error(`  ${lineNumStr} | ${lineContent}`);

			if (column) {
				const pointer = ' '.repeat(lineNumStr.length + 3 + (parseInt(column) - 1)) + '^';
				console.error(pointer);
			}

			if (hint) {
				const noteLabel = this.color(`${this.locale.note}:`, ANSI.cyan);
				console.error(`  ${noteLabel} ${hint}`);
			}
		}
	}

	success(text) {
		if (this.silent) return;

		const symbol = this.hasNerdFont ? '󰄬' : '✓';
		console.log(`${this.color(symbol, ANSI.greenBold)} ${text}`);
	}

	fail(text, errno = 1) {
		const symbol = this.hasNerdFont ? '󰅖' : '×';
		const msg = text || this.locale.failed;
		console.error(`${this.color(symbol, ANSI.redBold)} ${msg} (errno ${errno})`);
	}

	startSpinner(text) {
		if (!this.silent) return;
		if (!this.isTTY) return;

		this.spinnerIndex = 0;
		process.stdout.write(`${this.spinner[0]} ${text} (0%)\r`);

		this.spinnerInterval = setInterval(() => {
			this.spinnerIndex = (this.spinnerIndex + 1) % this.spinner.length;
			process.stdout.write(`${this.spinner[this.spinnerIndex]} ${text} (0%)\r`);
		}, 80);
	}

	updateSpinner(text, percent) {
		if (!this.silent) return;
		if (!this.isTTY) return;

		const percentStr = Math.round(percent).toString().padStart(2);
		process.stdout.write(`${this.spinner[this.spinnerIndex]} ${text} (${percentStr}%)\r`);
	}

	stopSpinner(text = null, success = true) {
		if (!this.silent) return;
		if (!this.isTTY) return;

		if (this.spinnerInterval) {
			clearInterval(this.spinnerInterval);
			this.spinnerInterval = null;
		}

		const symbol = success
			? (this.hasNerdFont ? '󰄬' : '✓')
			: (this.hasNerdFont ? '󰅖' : '×');
		const color = success ? ANSI.greenBold : ANSI.redBold;

		if (text) {
			process.stdout.write(`${this.color(symbol, color)} ${text}${' '.repeat(20)}\n`);
		} else {
			process.stdout.write('\n');
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
