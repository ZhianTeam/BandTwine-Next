#!/usr/bin/env node
/*
  File: conv/neg.js
  Revision number: 1
  License: GPL-3.0
  Copyleft (c) 2025-2026 ZhianTeam. All rights may not reserved.

  NeG (祈ぐ/Next Generation) - Migration tool to BandTwine Next
  BandTwine is a FLOSS Software distributed under AGPL-3.0 license. This software comes with ABSOLUTELY NO WARRANTY.
  You are welcome to redistribute it under certain conditions. See the GNU Affero General Public License for more details.
*/

import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import { fileURLToPath } from 'node:url';
import { execSync } from 'node:child_process';
import { isatty } from 'node:tty';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const VERSION = '1.0.0';

const ANSI = {
	reset: '\x1b[0m',
	bold: '\x1b[1m',
	blue: '\x1b[34m',
	green: '\x1b[32m',
	yellow: '\x1b[33m',
	red: '\x1b[31m',
	cyan: '\x1b[36m',
	blueBold: '\x1b[1;34m',
	greenBold: '\x1b[1;32m',
	yellowBold: '\x1b[1;33m',
	redBold: '\x1b[1;31m',
	cyanBold: '\x1b[1;36m'
};

const CUTE_ZH = {
	migrating: '正在迁移',
	parsing: '正在解析',
	converting: '正在转换',
	writing: '正在写入',
	done: '完成啦',
	error: 'error',
	warning: 'warning',
	failed: '迁移失败了呜呜……',
	success: '迁移成功！欢迎来到 Next Generation～',
	file_not_found: '找不到文件啦！路径是不是写错了呀？',
	parse_error: '解析失败了……JSON 格式可能有问题哦',
	no_metadata: '咦？找不到 metadata 诶……这真的是 BandTwine 的数据文件吗？',
	no_nodes: '啊咧？一个节点都没有诶……',
	collision: '变量冲突了！',
	collision_hint: '多个输入文件中有重复的变量定义，使用 -f/--force 来自动解决冲突',
	invalid_json: 'JSON 文件格式不对哦……',
	output_exists: '输出文件已经存在了呢',
	output_exists_hint: '如果要覆盖的话，请先手动删除或者移动它们～'
};

const C_LOCALE = {
	migrating: 'Migrating',
	parsing: 'Parsing',
	converting: 'Converting',
	writing: 'Writing',
	done: 'Done',
	error: 'error',
	warning: 'warning',
	failed: 'Migration Failed.',
	success: 'Migration Succeeded. Welcome to Next Generation.',
	file_not_found: 'File not found',
	parse_error: 'Parse error: Invalid JSON format',
	no_metadata: 'No metadata found. Is this a BandTwine data file?',
	no_nodes: 'No nodes found in the story',
	collision: 'Variable collision detected',
	collision_hint: 'Multiple input files contain duplicate variable definitions. Use -f/--force to resolve automatically.',
	invalid_json: 'Invalid JSON format',
	output_exists: 'Output files already exist',
	output_exists_hint: 'Please remove or move them manually before migration.'
};

let options = {
	quiet: false,
	verbose: false,
	strict: false,
	comment: false,
	force: false,
	preserve: false,
	overwrite: false,
	cLocale: false,
	noColor: false
};

let locale = CUTE_ZH;
let exitRequested = false;
let hasNerdFont = false;

function detectNerdFont() {
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

function setupSignalHandlers() {
	process.on('SIGINT', () => {
		if (exitRequested) {
			console.log('\n');
			log('fail', locale.failed + ' (interrupted)', 130);
			process.exit(130);
		}
		exitRequested = true;
		console.log('\n');
		log('warning', '^C detected. Press ^C again to force quit.');
	});

	process.on('SIGTERM', () => {
		console.log('\n');
		log('fail', locale.failed + ' (terminated)', 143);
		process.exit(143);
	});
}

function color(text, colorCode) {
	if (options.noColor) {
		return text;
	}
	return `${colorCode}${text}${ANSI.reset}`;
}

function log(type, message, exitCode = null) {
	if (options.quiet && type !== 'error' && type !== 'fail') {
		return;
	}

	let prefix = '';
	let output = console.log;

	switch (type) {
		case 'step':
			prefix = color('==>', ANSI.blueBold);
			break;
		case 'substep':
			if (!options.verbose) return;
			prefix = color('  -->', ANSI.greenBold);
			break;
		case 'info':
			prefix = color('::', ANSI.blueBold);
			break;
		case 'warning':
			prefix = color('::', ANSI.yellowBold);
			message = color(`${locale.warning}:`, ANSI.yellowBold) + ' ' + message;
			break;
		case 'error':
			prefix = color('::', ANSI.redBold);
			message = color(`${locale.error}:`, ANSI.redBold) + ' ' + message;
			output = console.error;
			break;
		case 'success':
			const successSymbol = hasNerdFont ? '󰄬' : '✓';
			prefix = color(successSymbol, ANSI.greenBold);
			break;
		case 'fail':
			const failSymbol = hasNerdFont ? '󰅖' : '×';
			prefix = color(failSymbol, ANSI.redBold);
			output = console.error;
			break;
		default:
			prefix = color('::', ANSI.blueBold);
	}

	output(`${prefix} ${message}`);

	if (exitCode !== null) {
		process.exit(exitCode);
	}
}

function showHelp() {
	console.log(`NeG (祈ぐ) - Migration tool to BandTwine Next

Usage: neg [args]

NeG automatically detects and migrates:
  Input:  ./bandtwine_src/*.json
  Output: ./src/bt/config.kdl and ./src/bt/story.twee

Arguments:
  -q     --quiet     Suppress non-error logs during migration
  -v   --verbose     Show parsing details and warnings for dirty inputs
  -s    --strict     Treat all syntax warnings as fatal errors
  -c   --comment     Parse JSONC (JSON with Comments) inputs
  -f     --force     Resolve variable collisions via last-in-wins strategy
  -o --overwrite     Overwrite existing output files without prompting
  -p  --preserve     Preserve original folder (\`bandtwine_src/\`) and files
  -V   --version     Show version of NeG
      --c-locale     Force GNU POSIX C.UTF-8 locale
`);
}

function parseArgs(args) {
	for (let i = 0; i < args.length; i++) {
		const arg = args[i];

		if (arg === '-h' || arg === '--help') {
			showHelp();
			process.exit(0);
		}

		if (arg === '-V' || arg === '--version') {
			console.log(`NeG v${VERSION}`);
			process.exit(0);
		}

		if (arg === '-q' || arg === '--quiet') {
			options.quiet = true;
		} else if (arg === '-v' || arg === '--verbose') {
			options.verbose = true;
		} else if (arg === '-s' || arg === '--strict') {
			options.strict = true;
		} else if (arg === '-c' || arg === '--comment') {
			options.comment = true;
		} else if (arg === '-f' || arg === '--force') {
			options.force = true;
		} else if (arg === '-o' || arg === '--overwrite') {
			options.overwrite = true;
		} else if (arg === '-p' || arg === '--preserve') {
			options.preserve = true;
		} else if (arg === '--c-locale') {
			options.cLocale = true;
		} else if (arg === '--no-color') {
			options.noColor = true;
		} else {
			log('error', `Unknown argument: ${arg}`, 1);
		}
	}
}

function detectInputFiles() {
	const sourceDir = path.resolve(process.cwd(), 'bandtwine_src');

	if (!fs.existsSync(sourceDir)) {
		log('error', `Source directory not found: ${sourceDir}\n  Expected: ./bandtwine_src/`, 1);
	}

	const files = fs.readdirSync(sourceDir)
		.filter(f => f.endsWith('.json'))
		.map(f => path.join(sourceDir, f));

	if (files.length === 0) {
		log('error', 'No JSON files found in ./bandtwine_src/', 1);
	}

	return files;
}

function prepareOutputDir() {
	const outputDir = path.resolve(process.cwd(), 'src/bt');

	if (!fs.existsSync(outputDir)) {
		log('substep', 'Creating output directory: src/bt/');
		fs.mkdirSync(outputDir, { recursive: true });
	}

	return outputDir;
}

function stripComments(jsonString) {
	return jsonString
		.replace(/\/\*[\s\S]*?\*\//g, '')
		.replace(/\/\/.*/g, '')
		.replace(/,(\s*[}\]])/g, '$1');
}

function parseJSON(filePath) {
	log('substep', `${locale.parsing} ${path.basename(filePath)}`);

	if (!fs.existsSync(filePath)) {
		log('error', `${locale.file_not_found}: ${filePath}`, 1);
	}

	let content = fs.readFileSync(filePath, 'utf8');

	if (options.comment) {
		content = stripComments(content);
	}

	try {
		return JSON.parse(content);
	} catch (err) {
		log('error', `${locale.parse_error}\n  File: ${filePath}\n  ${err.message}`, 1);
	}
}

function escapeKDLString(str) {
	return str
		.replace(/\\/g, '\\\\')
		.replace(/"/g, '\\"')
		.replace(/\n/g, '\\n')
		.replace(/\r/g, '\\r')
		.replace(/\t/g, '\\t');
}

function generateConfigKDL(metadata) {
	const lines = [];

	lines.push('/*');
	lines.push('  # Config File for BandTwine Next');
	lines.push('  ');
	lines.push('  Revision number: 1');
	lines.push('  License: AGPL-3.0');
	lines.push('  Copyleft (c) 2025-2026 ZhianTeam. All rights may not reserved.');
	lines.push('');
	lines.push('  This is BandTwine. A FLOSS interactive fiction engine.');
	lines.push('  BandTwine is a FLOSS Software distributed under AGPL-3.0 license. This software comes with ABSOLUTELY NO WARRANTY.');
	lines.push('  You are welcome to redistribute it under certain conditions. See the GNU Affero General Public License for more details.');
	lines.push('');
	lines.push('  AUTO-GENERATED by NeG migration tool');
	lines.push('*/');
	lines.push('');
	lines.push('meta {');
	lines.push(`\tname "${escapeKDLString(metadata.title || 'Untitled Story')}"`);
	if (metadata.description) {
		lines.push(`\tdescription "${escapeKDLString(metadata.description)}"`);
	}
	if (metadata.author) {
		lines.push(`\tauthor "${escapeKDLString(metadata.author)}"`);
	}
	lines.push('');
	lines.push('\tver {');
	lines.push(`\t\tid "${metadata.version || '1.0.0'}"`);
	lines.push(`\t\tcode ${metadata.versionCode || 1}`);
	if (metadata.releaseDate) {
		lines.push(`\t\trelease "${metadata.releaseDate}"`);
	}
	lines.push('\t}');
	lines.push('');
	lines.push('\tcopyright {');

	if (metadata.license) {
		const license = metadata.license.toUpperCase();
		if (license === 'CC-0' || license === 'CC0') {
			lines.push('\t\tlicense "CC0-1.0"');
		} else {
			lines.push(`\t\tlicense "${license}"`);
		}
	}

	if (metadata.copyright) {
		lines.push('\t\tcopyrighted');
		const ownerMatch = metadata.copyright.match(/©\s*\d{4}(?:-\d{4})?\s+(.+?)\.?$/);
		if (ownerMatch) {
			lines.push(`\t\towner "${escapeKDLString(ownerMatch[1].trim())}"`);
		}
	}

	lines.push('\t}');
	lines.push('}');
	lines.push('');
	lines.push('env {');
	lines.push('\tnamespace {');
	lines.push('\t\t');
	lines.push('\t}');
	lines.push('}');
	lines.push('');
	lines.push('properties {');
	lines.push(`\tstartNode "${metadata.indexNode || 'start'}"`);
	lines.push('}');

	return lines.join('\n');
}

function convertVariablePath(varPath) {
	return '$' + varPath.replace(/^var\./, '');
}

function convertConditionExpression(condition) {
	let expr = condition;

	expr = expr.replace(/var\.([a-zA-Z0-9_.]+)/g, (match, path) => {
		return '$' + path;
	});

	expr = expr.replace(/&&/g, 'and');
	expr = expr.replace(/\|\|/g, 'or');
	expr = expr.replace(/!/g, 'not ');

	return expr;
}

function convertTextMarkers(text, node, nodeId) {
	let converted = text;

	converted = converted.replace(/\{var\.([a-zA-Z0-9_.]+)\}/g, (match, varPath) => {
		return '<<print $' + varPath + '>>';
	});

	converted = converted.replace(/\{cond\.([a-zA-Z0-9_]+)\}/g, (match, condId) => {
		if (!node.conds || !node.conds[condId]) {
			if (options.verbose) {
				log('warning', `Conditional group "${condId}" not found in node "${nodeId}"`);
			}
			return match;
		}

		const conds = node.conds[condId];
		let result = '';

		for (let i = 0; i < conds.length; i++) {
			const cond = conds[i];

			if (cond.condition) {
				const convertedCond = convertConditionExpression(cond.condition);
				if (i === 0) {
					result += `<<if ${convertedCond}>>${cond.text}`;
				} else {
					result += `<<elseif ${convertedCond}>>${cond.text}`;
				}
			} else {
				result += `<<else>>${cond.text}<</if>>`;
				break;
			}
		}

		if (!result.includes('<</if>>')) {
			result += '<</if>>';
		}

		return result;
	});

	converted = converted.replace(/\{random\.([a-zA-Z0-9_]+)\}/g, (match, randomId) => {
		if (!node.randoms || !node.randoms[randomId]) {
			if (options.verbose) {
				log('warning', `Random group "${randomId}" not found in node "${nodeId}"`);
			}
			return match;
		}

		const randoms = node.randoms[randomId];
		const validOptions = randoms.filter(r => !r.condition || r.condition);

		if (validOptions.length === 0) {
			return '';
		}

		let result = '<<set _randomChoice = random(0, ' + (validOptions.length - 1) + ')>>';

		validOptions.forEach((opt, idx) => {
			if (idx === 0) {
				result += '<<if _randomChoice === ' + idx + '>>' + (opt.text || '');
			} else if (idx === validOptions.length - 1) {
				result += '<<else>>' + (opt.text || '') + '<</if>>';
			} else {
				result += '<<elseif _randomChoice === ' + idx + '>>' + (opt.text || '');
			}
		});

		return result;
	});

	converted = converted.replace(/\{img\.([a-zA-Z0-9_.]+)\}/g, (match, imgId) => {
		if (!node.imgs || !node.imgs[imgId]) {
			if (options.verbose) {
				log('warning', `Image "${imgId}" not found in node "${nodeId}"`);
			}
			return match;
		}

		const img = node.imgs[imgId];
		let imgPath = img.path;

		if (imgPath.startsWith('${') && imgPath.endsWith('}')) {
			const expr = imgPath.slice(2, -1);
			imgPath = '<<print ' + convertConditionExpression(expr) + '>>';
			return `[img[${imgPath}]]`;
		}

		if (!imgPath.startsWith('/')) {
			imgPath = '/common/images/' + imgPath;
		}

		return `[img[${imgPath}]]`;
	});

	converted = converted.replace(/\{(\d+)\}/g, (match, linkIndex) => {
		const idx = parseInt(linkIndex);
		if (!node.links || !node.links[idx]) {
			if (options.verbose) {
				log('warning', `Link index ${idx} not found in node "${nodeId}"`);
			}
			return match;
		}

		const link = node.links[idx];
		const linkText = link.text || 'Continue';
		const target = link.target || 'start';

		return `[[${linkText}|${target}]]`;
	});

	return converted;
}

function convertNodeToTwee(nodeId, node) {
	const lines = [];

	lines.push(`:: ${nodeId}`);

	if (node.title) {
		lines.push(`<<set document.title = "${escapeKDLString(node.title)}">>`);
		lines.push('');
	}

	if (node.actions && node.actions.length > 0) {
		node.actions.forEach(action => {
			const actionMacro = convertAction(action);
			if (actionMacro) {
				lines.push(actionMacro);
			}
		});
		lines.push('');
	}

	const convertedText = convertTextMarkers(node.text || '', node, nodeId);
	lines.push(convertedText);

	return lines.join('\n');
}

function convertAction(action) {
	switch (action.type) {
		case 'set': {
			const target = convertVariablePath(action.target);
			let value = action.value;

			if (typeof value === 'string' && value.startsWith('$(') && value.endsWith(')')) {
				const expr = value.slice(2, -1);
				const convertedExpr = convertConditionExpression(expr);
				return `<<set ${target} = ${convertedExpr}>>`;
			}

			if (typeof value === 'string' && value.startsWith('var.')) {
				value = convertVariablePath(value);
				return `<<set ${target} = ${value}>>`;
			}

			if (typeof value === 'string') {
				value = '"' + escapeKDLString(value) + '"';
			}

			return `<<set ${target} = ${value}>>`;
		}

		case 'add': {
			const target = convertVariablePath(action.target);
			const value = action.value;
			return `<<set ${target} += ${value}>>`;
		}

		case 'toggle': {
			const target = convertVariablePath(action.target);
			return `<<set ${target} = !${target}>>`;
		}

		case 'toast': {
			return `<<notify>>${action.message}<</notify>>`;
		}

		case 'vibrate': {
			return `<<vibrate "${action.mode || 'short'}">>`;
		}

		case 'autosave': {
			return '<<autosave>>';
		}

		case 'jump': {
			if (action.condition) {
				const cond = convertConditionExpression(action.condition);
				return `<<if ${cond}>><<goto "${action.target}">><</if>>`;
			}
			return `<<goto "${action.target}">>`;
		}

		case 'advanceTime': {
			return `<<advanceTime ${action.minutes}>>`;
		}

		default:
			if (options.verbose) {
				log('warning', `Unknown action type: ${action.type}`);
			}
			return null;
	}
}

function generateTwee(allNodes, startNode) {
	const lines = [];

	lines.push(':: StoryTitle');
	lines.push('BandTwine Story');
	lines.push('');
	lines.push(':: StoryData');
	lines.push('{');
	lines.push('\t"ifid": "' + crypto.randomUUID().toUpperCase() + '",');
	lines.push('\t"format": "SugarCube",');
	lines.push('\t"format-version": "2.37.3",');
	lines.push('\t"start": "' + (startNode || 'start') + '"');
	lines.push('}');
	lines.push('');

	lines.push(`:: Start [tag="${startNode || 'start'}"]`);
	lines.push('');

	Object.entries(allNodes).forEach(([nodeId, node]) => {
		lines.push(convertNodeToTwee(nodeId, node));
		lines.push('');
	});

	return lines.join('\n');
}

async function main() {
	setupSignalHandlers();

	const args = process.argv.slice(2);
	parseArgs(args);

	if (options.cLocale) {
		locale = C_LOCALE;
	}

	if (!process.stdout.isTTY) {
		options.noColor = true;
	}

	hasNerdFont = detectNerdFont();

	log('step', `${locale.migrating} from BandTwine legacy to Next Generation...`);

	const inputFiles = detectInputFiles();
	const outputDir = prepareOutputDir();

	log('info', `Found ${inputFiles.length} input file(s) in ./bandtwine_src/`);

	let metadata = null;
	const allNodes = {};
	const allVariables = {};

	for (const inputFile of inputFiles) {
		log('substep', `Reading ${path.basename(inputFile)}`);

		const data = parseJSON(inputFile);

		if (data.metadata) {
			if (metadata && !options.force) {
				log('warning', `Multiple metadata found, using the last one`);
			}
			metadata = data.metadata;
			log('substep', `  Found metadata: "${metadata.title || 'Untitled'}"`);
		}

		if (data.nodes) {
			const nodeCount = Object.keys(data.nodes).length;
			log('substep', `  Found ${nodeCount} node(s)`);

			Object.entries(data.nodes).forEach(([nodeId, node]) => {
				if (allNodes[nodeId] && !options.force) {
					log('error', `${locale.collision}: node "${nodeId}" exists in multiple files\n  ${locale.collision_hint}`, 1);
				}
				allNodes[nodeId] = node;
			});
		}

		if (data.variables) {
			log('substep', `  Found variables`);

			Object.entries(data.variables).forEach(([key, value]) => {
				if (allVariables[key] && !options.force) {
					log('error', `${locale.collision}: variable "${key}" exists in multiple files\n  ${locale.collision_hint}`, 1);
				}
				allVariables[key] = value;
			});
		}
	}

	if (!metadata) {
		log('error', `${locale.no_metadata}\n  Expected: metadata.json or metadata field in any JSON file`, 1);
	}

	if (Object.keys(allNodes).length === 0) {
		log('error', locale.no_nodes, 1);
	}

	log('info', `Total: ${Object.keys(allNodes).length} nodes collected`);

	log('step', `${locale.converting} metadata to KDL format...`);
	const configKDL = generateConfigKDL(metadata);

	const configPath = path.join(outputDir, 'config.kdl');
	const tweePath = path.join(outputDir, 'story.twee');

	if (fs.existsSync(configPath) && !options.overwrite) {
		log('warning', `${locale.output_exists}: ${configPath}`);
		log('error', locale.output_exists_hint + '\n  Or use -o/--overwrite to force overwrite', 1);
	}

	if (fs.existsSync(tweePath) && !options.overwrite) {
		log('warning', `${locale.output_exists}: ${tweePath}`);
		log('error', locale.output_exists_hint + '\n  Or use -o/--overwrite to force overwrite', 1);
	}

	log('step', `${locale.converting} ${Object.keys(allNodes).length} nodes to Twee format...`);
	const tweeContent = generateTwee(allNodes, metadata.indexNode);

	log('step', `${locale.writing} config to ${path.relative(process.cwd(), configPath)}...`);
	fs.writeFileSync(configPath, configKDL, 'utf8');

	log('step', `${locale.writing} story to ${path.relative(process.cwd(), tweePath)}...`);
	fs.writeFileSync(tweePath, tweeContent, 'utf8');

	if (!options.preserve) {
		log('substep', 'Cleaning up source files...');
		for (const inputFile of inputFiles) {
			log('substep', `Removing ${path.basename(inputFile)}`);
			fs.unlinkSync(inputFile);
		}

		const bandtwineSrcDir = path.resolve(process.cwd(), 'bandtwine_src');
		const files = fs.readdirSync(bandtwineSrcDir);
		if (files.length === 0) {
			log('substep', 'Removing empty bandtwine_src directory');
			fs.rmdirSync(bandtwineSrcDir);
		}
	}

	console.log('');
	log('success', locale.success);
	log('info', `  Config: ${path.relative(process.cwd(), configPath)}`);
	log('info', `  Story:  ${path.relative(process.cwd(), tweePath)}`);
}

main().catch(err => {
	log('error', err.message);
	if (options.verbose) {
		console.error(err.stack);
	}
	process.exit(1);
});
