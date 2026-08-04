/*
 * File: index.js
 * Revision number: 1
 * License: GPL-3.0
 * Copyleft (c) 2025-2026 ZhianTeam. All rights may not reserved.
 *
 * This is the converter for BandTwine Next to squash original KDL configuration file to a minimized binary format.
 * BandTwine is a FLOSS Software distributed under AGPL-3.0 license. This software comes with ABSOLUTELY NO WARRANTY.
 * You are welcome to redistribute it under certain conditions. See the GNU Affero General Public License for more details.
 */

import fs from 'node:fs';
import path from 'node:path';
import { tokenize } from './src/lexer.js';
import { parse } from './src/parser.js';
import { validate } from './src/validator.js';
import { encode } from './src/encoder.js';
import { KDLError } from './src/errors.js';

const COLORS = {
  reset: '\x1b[0m',
  blue: '\x1b[34m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  red: '\x1b[31m'
};

function log(type, message) {
  const formats = {
    info: `${COLORS.blue}::${COLORS.reset}`,
    step: `${COLORS.blue}==>${COLORS.reset}`,
    substep: `${COLORS.green}  -->${COLORS.reset}`,
    warning: `${COLORS.blue}::${COLORS.reset} ${COLORS.yellow}warning:${COLORS.reset}`,
    error: `${COLORS.blue}::${COLORS.reset} ${COLORS.red}error:${COLORS.reset}`
  };
  console.log(`${formats[type]} ${message}`);
}

function formatError(error, filename) {
  if (error instanceof KDLError) {
    return `${filename}:${error.line}:${error.column}: ${error.message}`;
  }
  return error.message;
}

export async function compileKDL(inputPath, outputPath = 'configs.bin') {
  log('info', 'Squashing Configuration file to binary...');
  
  try {
    // Read source file
    log('step', 'Reading source file...');
    const source = fs.readFileSync(inputPath, 'utf-8');
    log('substep', `Loaded ${source.length} bytes from ${path.basename(inputPath)}`);
    
    // Tokenize
    log('step', 'Tokenizing...');
    const tokens = tokenize(source, inputPath);
    log('substep', `Generated ${tokens.length} tokens`);
    
    // Parse
    log('step', 'Parsing AST...');
    const ast = parse(tokens, source, inputPath);
    log('substep', `Built abstract syntax tree with ${ast.children.length} root nodes`);
    
    // Validate
    log('step', 'Validating semantics...');
    const validationResult = validate(ast);
    
    if (validationResult.warnings.length > 0) {
      for (const warning of validationResult.warnings) {
        log('warning', formatError(warning, inputPath));
      }
    }
    
    if (!validationResult.valid) {
      for (const error of validationResult.errors) {
        log('error', formatError(error, inputPath));
      }
      throw new Error('Validation failed with errors');
    }
    
    log('substep', 'Semantic validation passed');
    
    // Encode
    log('step', 'Encoding to binary format...');
    const binary = encode(validationResult.data);
    log('substep', `Encoded ${binary.length} bytes (compression ratio: ${(binary.length / source.length * 100).toFixed(1)}%)`);
    
    // Write output
    log('info', `Writing out to \`${outputPath}\`...`);
    fs.writeFileSync(outputPath, binary);
    log('substep', `Successfully written ${binary.length} bytes`);
    
    return {
      success: true,
      data: validationResult.data,
      binary,
      stats: {
        sourceSize: source.length,
        binarySize: binary.length,
        compressionRatio: binary.length / source.length
      }
    };
    
  } catch (error) {
    if (error instanceof KDLError) {
      log('error', formatError(error, inputPath));
    } else {
      log('error', error.message);
    }
    throw error;
  }
}

// CLI support
if (import.meta.url === `file://${process.argv[1]}`) {
  const inputFile = process.argv[2] || 'configs.kdl';
  const outputFile = process.argv[3] || 'configs.bin';
  
  compileKDL(inputFile, outputFile)
    .then(() => process.exit(0))
    .catch(() => process.exit(1));
}
