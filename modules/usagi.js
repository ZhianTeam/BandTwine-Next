#!/usr/bin/env node
/*
  File: usagi.js
  Revision number: 6
  License: GPL-3.0
  Copyleft (c) 2025-2026 ZhianTeam. All rights may not reserved.

  This is the main entry point for Usagi compiler.
  BandTwine is a FLOSS Software distributed under AGPL-3.0 license. This software comes with ABSOLUTELY NO WARRANTY.
  You are welcome to redistribute it under certain conditions. See the GNU Affero General Public License for more details.
*/

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { exec, execSync } from 'node:child_process';
import crypto from 'node:crypto';
import { promisify } from 'node:util';
import Logger from './logger.js';
import { compileKDL } from './kdlcomp/index.js';
import { compileTwee } from './tweecomp/index.js';
import { compressImages } from './imagecomp/index.js';
import { loadDeviceTree, validateDeviceCodename } from './dts/loader.js';
import { validateCrossReferences } from './cross-validator.js';
import { expressProgress } from './personality.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const PROJECT_ROOT = path.resolve(__dirname, '..');

const VERSION = '0.1.0-alpha';
const execAsync = promisify(exec);

function showHelp() {
	console.log(`Usagi - Compiler actually does things for BandTwine

Usage:
  usagi --path <path|.> <build>|<release> [args] [flags]

Arguments:
 -i         --interactive      Compile with an embedded TUI
 -q               --quiet      Remove most of console messages
 -s              --silent      Single-line progress mode
 -v             --verbose      Output with more details
               --c-locale      Force GNU POSIX C.UTF-8 locale for Output
 -S              --strict      Treat all warnings as errors and stop compilation immediately
             --skip-check      Skip all checks and validations and post compilation immediately
 -N                --nerd      Force use Nerd Icons and Symbols
               --no-color      Disable ANSI Coloring (automatically for pipe/redirection)
 -V             --version      Show version of Usagi

Flags:
 -o       --output=<path>      Custom output artifact location (default: ./dist/)
      --device=<codename>      Specify target devices (default: all), split by comma (,)
           --jsc=<on|off>      Enable JavaScript Compilation (default varied by device)
           --pbf=<on|off>      Enable protobuf embedding (default varied by device)
 -C          --cwd=<path>      Custom temporary building directory
 -c  --custom-aiot=<path>      Custom \`aiot-toolkit\` path for Usagi
 -d          --no-cleanup      Do not cleanup the temporary directory for debugging propose
`);
}

function parseArgs(args) {
	const options = {
		path: '.',
		mode: null,
		interactive: false,
		quiet: false,
		silent: false,
		verbose: false,
		cLocale: false,
		strict: false,
		skipCheck: false,
		forceNerd: false,
		noColor: false,
		output: 'dist',
		devices: null,
		jsc: null,
		pbf: null,
		customCwd: null,
		customAiot: null,
		noCleanup: false
	};

	for (let i = 0; i < args.length; i++) {
		const arg = args[i];

		if (arg === '-h' || arg === '--help') {
			showHelp();
			process.exit(0);
		}

		if (arg === '-V' || arg === '--version') {
			console.log(`Usagi v${VERSION}`);
			process.exit(0);
		}

		if (arg === '-i' || arg === '--interactive') {
			options.interactive = true;
		} else if (arg === '-q' || arg === '--quiet') {
			options.quiet = true;
		} else if (arg === '-s' || arg === '--silent') {
			options.silent = true;
		} else if (arg === '-v' || arg === '--verbose') {
			options.verbose = true;
		} else if (arg === '--c-locale') {
			options.cLocale = true;
		} else if (arg === '-S' || arg === '--strict') {
			options.strict = true;
		} else if (arg === '--skip-check') {
			options.skipCheck = true;
		} else if (arg === '-N' || arg === '--nerd') {
			options.forceNerd = true;
		} else if (arg === '--no-color') {
			options.noColor = true;
		} else if (arg === '-d' || arg === '--no-cleanup') {
			options.noCleanup = true;
		} else if (arg === '--path') {
			options.path = args[++i];
		} else if (arg.startsWith('--path=')) {
			options.path = arg.split('=')[1];
		} else if (arg === '-o' || arg === '--output') {
			options.output = args[++i];
		} else if (arg.startsWith('--output=')) {
			options.output = arg.split('=')[1];
		} else if (arg === '--device') {
			options.devices = args[++i];
		} else if (arg.startsWith('--device=')) {
			options.devices = arg.split('=')[1];
		} else if (arg.startsWith('--jsc=')) {
			options.jsc = arg.split('=')[1];
		} else if (arg.startsWith('--pbf=')) {
			options.pbf = arg.split('=')[1];
		} else if (arg === '-C' || arg === '--cwd') {
			options.customCwd = args[++i];
		} else if (arg.startsWith('--cwd=')) {
			options.customCwd = arg.split('=')[1];
		} else if (arg === '-c' || arg === '--custom-aiot') {
			options.customAiot = args[++i];
		} else if (arg.startsWith('--custom-aiot=')) {
			options.customAiot = arg.split('=')[1];
		} else if (arg === 'build' || arg === 'release') {
			options.mode = arg;
		} else if (!arg.startsWith('-')) {
			if (!options.mode) {
				options.mode = arg;
			}
		}
	}

	return options;
}

function checkAiotToolkit(customPath) {
	if (customPath) {
		if (fs.existsSync(customPath)) {
			return customPath;
		}
		throw new Error(`Custom aiot-toolkit not found at: ${customPath}`);
	}

	const localPath = path.join(PROJECT_ROOT, 'node_modules', 'aiot-toolkit', 'lib', 'bin.js');
	if (fs.existsSync(localPath)) {
		return localPath;
	}

	try {
		execSync('which aiot', { stdio: 'ignore' });
		return 'aiot';
	} catch {
		return null;
	}
}

function generateBuildHash(srcPath, config) {
	const hash = crypto.createHash('sha1');
	hash.update(srcPath);
	hash.update(config.mode || 'build');
	hash.update(config.devices || 'all');
	hash.update(Date.now().toString());
	return hash.digest('hex').substring(0, 12);
}

async function compile(options) {
	const logger = new Logger({
		verbose: options.verbose,
		quiet: options.quiet,
		silent: options.silent,
		cLocale: options.cLocale,
		noColor: options.noColor,
		forceNerd: options.forceNerd,
		strict: options.strict
	});

	let buildDir = null;
	let sigintCount = 0;
	let lastSigintTime = 0;
	let isShuttingDown = false;

	const cleanup = () => {
		if (buildDir && !options.noCleanup && fs.existsSync(buildDir)) {
			try {
				process.chdir(PROJECT_ROOT);
				fs.rmSync(buildDir, { recursive: true, force: true });
			} catch (err) {
				// Ignore cleanup errors
			}
		}
	};

	const handleSigint = () => {
		if (isShuttingDown) {
			return;
		}

		const now = Date.now();
		if (now - lastSigintTime < 1000) {
			sigintCount++;
		} else {
			sigintCount = 1;
		}
		lastSigintTime = now;

		if (sigintCount >= 3) {
			const panicMsg = logger.cLocale
				? '\nTriple SIGINT detected, aborting immediately... (╥﹏╥)\n'
				: '\n连按三次了！我知道了，马上停下来！(╥﹏╥)\n';
			process.stderr.write(panicMsg);
			cleanup();
			setImmediate(() => process.exit(130));
			return;
		}

		isShuttingDown = true;

		const stopMsg = logger.cLocale
			? '\nYou want me to stop? Okay, I\'ll stop. (´・ω・`)\n'
			: '\n你要让我停下来吗？嗯，那我就停下来吧。(´・ω・`)\n';
		process.stderr.write(stopMsg);

		if (logger.spinnerInterval) {
			clearInterval(logger.spinnerInterval);
			logger.spinnerInterval = null;
		}

		cleanup();
		setImmediate(() => process.exit(0));
	};

	const handleSigterm = () => {
		const termMsg = logger.cLocale
			? '\nReceived termination signal, cleaning up... (｡•́︿•̀｡)\n'
			: '\n收到终止信号了……正在清理中 (｡•́︿•̀｡)\n';
		process.stderr.write(termMsg);
		cleanup();
		setImmediate(() => process.exit(143));
	};

	process.on('SIGINT', handleSigint);
	process.on('SIGTERM', handleSigterm);

	if (options.interactive) {
		const msg = logger.cLocale
			? 'Interactive mode is not implemented yet. Use standard mode instead.'
			: '交互模式还没有实现呢。请使用标准模式吧。';
		logger.error(msg);
		process.exit(1);
	}

	if (!options.mode) {
		logger.error('Missing build mode: specify <build> or <release>');
		logger.fail(null, 1);
		process.exit(1);
	}

	logger.step('Loading devicetree...');
	let deviceTree;
	try {
		deviceTree = loadDeviceTree();
		logger.substep(`Loaded ${Object.keys(deviceTree).length} device definitions`);
	} catch (err) {
		logger.error(`Failed to load devicetree: ${err.message}`);
		logger.fail(null, 1);
		process.exit(1);
	}

	let targetDevices = [];
	if (options.devices) {
		const requestedDevices = options.devices.split(',').map(d => d.trim());
		for (const codename of requestedDevices) {
			try {
				validateDeviceCodename(codename, deviceTree);
				targetDevices.push(codename);
			} catch (err) {
				logger.error(err.message);
				logger.fail(null, 1);
				process.exit(1);
			}
		}
		logger.substep(`Target devices: ${targetDevices.map(d => `${d} (${deviceTree[d].pretty})`).join(', ')}`);
	} else {
		targetDevices = ['n67'];
		logger.substep('No devices specified, defaulting to n67 (Xiaomi Smart Band 9 Pro)');
	}

	const primaryDevice = deviceTree[targetDevices[0]];

	if (options.jsc === null) {
		options.jsc = primaryDevice.jscDefault ? 'on' : 'off';
		logger.substep(`JSC auto-set to '${options.jsc}' based on device capabilities`);
	}

	if (options.pbf === null) {
		options.pbf = primaryDevice.pbfDefault ? 'on' : 'off';
		logger.substep(`PBF auto-set to '${options.pbf}' based on device capabilities`);
	}

	const aiotPath = checkAiotToolkit(options.customAiot);
	if (!aiotPath) {
		const errMsg = logger.cLocale
			? 'aiot-toolkit not found. Please install it: npm install aiot-toolkit'
			: '找不到 aiot-toolkit 呢…请先安装它哦：npm install aiot-toolkit';
		logger.error(errMsg);
		logger.fail(null, 1);
		process.exit(1);
	}

	const srcPath = path.resolve(options.path);
	if (!fs.existsSync(srcPath)) {
		logger.error(`Source directory not found: ${srcPath}`);
		logger.fail(null, 1);
		process.exit(1);
	}

	const srcInnerPath = path.join(srcPath, 'src');
	if (!fs.existsSync(srcInnerPath)) {
		logger.error(`Source directory not found: ${srcInnerPath}`);
		logger.fail(null, 1);
		process.exit(1);
	}

	const btPath = path.join(srcInnerPath, 'bt');
	if (!fs.existsSync(btPath)) {
		logger.error(`BandTwine source directory not found: ${btPath}`);
		logger.fail(null, 1);
		process.exit(1);
	}

	const configPath = path.join(btPath, 'config.kdl');
	if (!fs.existsSync(configPath)) {
		logger.error(`Configuration file not found: ${configPath}`);
		logger.fail(null, 1);
		process.exit(1);
	}

	logger.info(logger.t('compiling') + ' BandTwine...');

	if (options.silent) {
		logger.startSpinner(logger.t('compiling'));
	}

	const buildHash = generateBuildHash(srcInnerPath, options);
	buildDir = options.customCwd || path.join(PROJECT_ROOT, '.bt-build', buildHash);

	try {
		const stepMsg = logger.cLocale ? 'Creating temporary build directory...' : expressProgress('reading');
		logger.step(stepMsg);
		logger.updateSpinner(null, 5);
		fs.mkdirSync(buildDir, { recursive: true });
		logger.substep(`Created ${buildDir}`);

		process.chdir(buildDir);

		logger.step('Setting up build environment...');
		logger.updateSpinner(null, 10);

		const linkTargets = ['node_modules', 'package.json', 'package-lock.json', 'sign'];
		for (const target of linkTargets) {
			const srcTarget = path.join(PROJECT_ROOT, target);
			const dstTarget = path.join(buildDir, target);

			if (fs.existsSync(srcTarget)) {
				fs.symlinkSync(srcTarget, dstTarget, fs.lstatSync(srcTarget).isDirectory() ? 'dir' : 'file');
				logger.substep(`Linked ${target}`);
			}
		}

		logger.step('Copying source files...');
		logger.updateSpinner(null, 15);
		const buildSrcPath = path.join(buildDir, 'src');
		fs.cpSync(srcInnerPath, buildSrcPath, { recursive: true });
		logger.substep(`Copied to ${buildSrcPath}`);

		if (!options.skipCheck) {
			logger.info('Running validation checks...');
		}

		logger.info('Compiling configuration...');
		logger.updateSpinner(null, 20);
		if (!logger.cLocale && logger.verbose) {
			logger.substep(expressProgress('parsing'));
		}
		const configBinPath = path.join(buildSrcPath, 'bt', 'configs.bin');
		const configResult = await compileKDL(configPath, configBinPath, logger, {
			deviceTree: deviceTree,
			targetDevices: targetDevices
		});

		logger.info('Compiling story files...');
		logger.updateSpinner(null, 35);
		if (!logger.cLocale && logger.verbose) {
			logger.substep(expressProgress('tokenizing'));
		}
		const storyBinPath = path.join(buildSrcPath, 'bt', 'story.bin');
		const tweeResult = await compileTwee(btPath, storyBinPath, logger, { skipCheck: options.skipCheck });

		if (!options.skipCheck) {
			logger.info('Cross-validating references...');
			logger.updateSpinner(null, 40);
			if (!logger.cLocale && logger.verbose) {
				logger.substep(expressProgress('validating'));
			}
			const crossCheck = validateCrossReferences(
				configResult.data,
				tweeResult.passages,
				logger
			);

			if (crossCheck.errors.length > 0) {
				for (const err of crossCheck.errors) {
					const message = logger.cLocale ? err.message : (err.cMessage || err.message);
					logger.error(message, err.context);
				}
				throw new Error('Cross-validation failed');
			}

			if (crossCheck.warnings.length > 0) {
				for (const warn of crossCheck.warnings) {
					const message = logger.cLocale ? warn.message : (warn.cMessage || warn.message);
					const context = logger.cLocale ? warn.context : (warn.cContext || warn.context);
					logger.warning(message, context);
				}
			}

			logger.substep('Cross-validation passed');
		}

		logger.step('Cleaning up source files in build directory...');
		const kdlFiles = fs.readdirSync(path.join(buildSrcPath, 'bt')).filter(f => f.endsWith('.kdl'));
		for (const kdlFile of kdlFiles) {
			fs.unlinkSync(path.join(buildSrcPath, 'bt', kdlFile));
			logger.substep(`Removed ${kdlFile}`);
		}

		const tweeFiles = fs.readdirSync(path.join(buildSrcPath, 'bt')).filter(f => f.endsWith('.twee') || f.endsWith('.twee.txt'));
		for (const tweeFile of tweeFiles) {
			fs.unlinkSync(path.join(buildSrcPath, 'bt', tweeFile));
			logger.substep(`Removed ${tweeFile}`);
		}

		logger.info('Processing assets...');
		logger.updateSpinner(null, 50);
		if (!logger.cLocale && logger.verbose) {
			logger.substep(expressProgress('encoding'));
		}
		const assetsPath = path.join(srcInnerPath, 'assets');
		const buildAssetsPath = path.join(buildSrcPath, 'assets');

		if (fs.existsSync(assetsPath)) {
			await compressImages(assetsPath, buildAssetsPath, logger);
		} else {
			logger.substep('No assets directory found, skipping');
		}

		logger.info('Calling aiot-toolkit...');
		logger.updateSpinner(null, 60);
		const aiotCmd = aiotPath.endsWith('.js') ? `node "${aiotPath}"` : aiotPath;
		const aiotArgs = [];

		if (options.mode === 'release') {
			aiotArgs.push('release');
			aiotArgs.push('--enable-image-png8');
		} else {
			aiotArgs.push('build');
		}

		if (options.jsc === 'on') {
			aiotArgs.push('--enable-jsc');
		}

		if (options.pbf === 'on') {
			aiotArgs.push('--enable-protobuf');
		}

		const fullCmd = `${aiotCmd} ${aiotArgs.join(' ')}`;
		logger.substep(`Executing: ${fullCmd}`);

		try {
			const { stdout: result } = await execAsync(fullCmd, {
				stdio: 'pipe',
				cwd: buildDir,
				encoding: 'utf8',
				killSignal: 'SIGTERM'
			});

			if (isShuttingDown) {
				return;
			}

			if (result.includes('❌')) {
				throw new Error('aiot-toolkit reported errors');
			}

			if (options.verbose && result) {
				console.log(result);
			}

			logger.updateSpinner(null, 85);
		} catch (err) {
			if (isShuttingDown) {
				return;
			}

			if (err.signal === 'SIGINT' || err.signal === 'SIGTERM') {
				return;
			}

			const output = err.stdout || err.stderr || '';
			if (output.includes('❌') || err.message.includes('aiot-toolkit reported errors')) {
				const failMsg = logger.cLocale
					? 'aiot-toolkit compilation failed'
					: 'aiot-toolkit 编译失败了……检查一下输出吧';
				logger.error(failMsg);
				if (options.verbose) {
					console.error(output);
				}
			} else {
				logger.error('aiot-toolkit failed');
			}
			throw err;
		}

		logger.info('Moving artifacts...');
		logger.updateSpinner(null, 90);
		const distPath = path.resolve(PROJECT_ROOT, options.output);
		fs.mkdirSync(distPath, { recursive: true });

		const buildDistPath = path.join(buildDir, 'dist');
		if (fs.existsSync(buildDistPath)) {
			const files = fs.readdirSync(buildDistPath);
			for (const file of files) {
				if (file.endsWith('.rpk')) {
					const src = path.join(buildDistPath, file);
					const dst = path.join(distPath, file);
					fs.copyFileSync(src, dst);
					logger.substep(`Moved ${file} to ${distPath}`);
				}
			}
		}

		if (!options.noCleanup) {
			logger.step('Cleaning up...');
			logger.updateSpinner(null, 95);
			process.chdir(PROJECT_ROOT);
			fs.rmSync(buildDir, { recursive: true, force: true });
			logger.substep('Temporary directory removed');
		} else {
			logger.substep(`Build directory preserved: ${buildDir}`);
		}

		if (isShuttingDown) {
			return 0;
		}

		const successMsg = logger.cLocale
			? 'Compilation Succeeded.'
			: '编译成功！';

		if (options.silent) {
			logger.stopSpinner(successMsg, true);
		} else {
			logger.success(successMsg);
		}

		process.removeListener('SIGINT', handleSigint);
		process.removeListener('SIGTERM', handleSigterm);

		return 0;

	} catch (error) {
		if (isShuttingDown) {
			return 0;
		}

		if (options.silent) {
			logger.stopSpinner(null, false);
		}

		logger.error(error.message);

		if (options.verbose && error.stack) {
			console.error(error.stack);
		}

		const failMsg = logger.cLocale
			? 'Compilation Failed. Stop.'
			: '编译中止。哼～';
		logger.fail(failMsg, 1);

		cleanup();

		process.removeListener('SIGINT', handleSigint);
		process.removeListener('SIGTERM', handleSigterm);

		process.exit(1);
	}
}

const args = process.argv.slice(2);

if (args.length === 0) {
	showHelp();
	process.exit(0);
}

const options = parseArgs(args);

compile(options).then(code => {
	process.exit(code);
}).catch(err => {
	console.error('Fatal error:', err.message);
	process.exit(1);
});
