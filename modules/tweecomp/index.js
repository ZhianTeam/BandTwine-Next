/*
  File: index.js
  Revision number: 1
  License: GPL-3.0
  Copyleft (c) 2025-2026 ZhianTeam. All rights may not reserved.

  This is the Twee compiler for BandTwine Next to compile SugarCube v2 stories to binary format.
  BandTwine is a FLOSS Software distributed under AGPL-3.0 license. This software comes with ABSOLUTELY NO WARRANTY.
  You are welcome to redistribute it under certain conditions. See the GNU Affero General Public License for more details.
*/

import fs from 'node:fs';
import path from 'node:path';
import { TweeParser, TweeParseError } from './src/parser.js';
import { encode } from './src/encoder.js';

export async function compileTwee(inputDir, outputPath = 'story.bin', logger = null) {
	const log = logger || {
		step: console.log,
		substep: console.log,
		warning: console.warn,
		error: console.error,
		errorWithContext: console.error
	};

	log.step('Collecting Twee files...');

	const tweeFiles = [];
	const entries = fs.readdirSync(inputDir, { withFileTypes: true });

	for (const entry of entries) {
		if (entry.isFile()) {
			if (entry.name.endsWith('.twee')) {
				tweeFiles.push(path.join(inputDir, entry.name));
			} else if (entry.name.endsWith('.twee.txt') && !tweeFiles.some(f => f.replace(/\.txt$/, '') === path.join(inputDir, entry.name).replace(/\.txt$/, ''))) {
				tweeFiles.push(path.join(inputDir, entry.name));
			}
		}
	}

	if (tweeFiles.length === 0) {
		throw new Error(`No .twee or .twee.txt files found in ${inputDir}`);
	}

	log.substep(`Found ${tweeFiles.length} Twee file(s)`);

	const allPassages = [];
	const errors = [];
	const warnings = [];

	log.step('Parsing Twee files...');

	for (const file of tweeFiles) {
		const source = fs.readFileSync(file, 'utf8');
		const parser = new TweeParser(source, path.basename(file));

		try {
			const result = parser.parse();
			log.substep(`Parsed ${path.basename(file)}: ${result.passageCount} passage(s)`);

			for (const passage of result.passages) {
				const macroErrors = TweeParser.validateMacros(
					passage.content,
					path.basename(file),
					passage.name,
					passage.line
				);

				if (macroErrors.length > 0) {
					errors.push(...macroErrors);
				}

				allPassages.push({
					...passage,
					sourceFile: path.basename(file)
				});
			}
		} catch (err) {
			if (err instanceof TweeParseError) {
				errors.push({
					message: err.message,
					line: err.line,
					column: err.column,
					filename: err.filename
				});
			} else {
				throw err;
			}
		}
	}

	if (errors.length > 0) {
		log.step('Validation errors found:');
		for (const err of errors) {
			const location = `${err.filename}:${err.line}:${err.column}`;
			const message = logger && logger.cLocale ? (err.cMessage || err.message) : err.message;
			const hint = logger && logger.cLocale ? (err.cHint || err.hint) : err.hint;

			if (logger && logger.errorWithContext) {
				logger.errorWithContext(message, location, err.lineContent, err.column, hint);
			} else {
				log.error(`${location}: ${message}`);
			}
		}
		throw new Error('Twee validation failed');
	}

	const passageNames = new Set();
	for (const passage of allPassages) {
		if (passageNames.has(passage.name)) {
			warnings.push(`Duplicate passage name: "${passage.name}"`);
		}
		passageNames.add(passage.name);
	}

	if (warnings.length > 0) {
		for (const warning of warnings) {
			log.warning(warning);
		}
	}

	log.step('Encoding to binary format...');
	const binary = encode({ passages: allPassages });
	log.substep(`Encoded ${binary.length} bytes (${allPassages.length} passages)`);

	log.step(`Writing to ${outputPath}...`);
	fs.writeFileSync(outputPath, binary);
	log.substep(`Successfully written ${binary.length} bytes`);

	return {
		success: true,
		passageCount: allPassages.length,
		binarySize: binary.length,
		sourceFiles: tweeFiles.length
	};
}

if (import.meta.url === `file://${process.argv[1]}`) {
	const inputDir = process.argv[2] || 'src/bt';
	const outputFile = process.argv[3] || 'story.bin';

	compileTwee(inputDir, outputFile)
		.then(() => process.exit(0))
		.catch(err => {
			console.error(err.message);
			process.exit(1);
		});
}
