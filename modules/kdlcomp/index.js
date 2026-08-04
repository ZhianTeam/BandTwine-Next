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

function translateValidationMessage(message, isError) {
	const translations = {
		"missing required field 'name'": "缺少必需字段 'name' 啦",
		"must be a non-empty string": "必须是非空字符串哦",
		"must be a string": "必须是字符串呢",
		"node present but no authors specified": "节点存在但没有指定作者",
		"missing 'ver' block": "缺少 'ver' 块；版本信息会丢失哦",
		"missing required field 'id'": "缺少必需字段 'id'",
		"does not follow semver format": "不符合 semver 格式 (X.Y.Z)",
		"missing required field 'code'": "缺少必需字段 'code'",
		"must be a non-negative integer": "必须是非负整数",
		"expected a date string": "期望日期字符串格式 YYYY-MM-DD",
		"is not a valid date": "不是有效的日期格式",
		"is not a recognized SPDX identifier": "不是已知的 SPDX 许可证标识符",
		"is set but no 'owner' is specified": "设置了但没有指定 'owner'",
		"unknown field": "未知字段",
		"will be ignored": "会被忽略",
		"namespace node should not have arguments": "命名空间节点不应该有参数",
		"namespace node should not have properties": "命名空间节点不应该有属性",
		"empty namespace": "空命名空间",
		"variable declaration must not have a children block": "变量声明不能有子块",
		"variable declaration must not have properties": "变量声明不能有属性",
		"variable must have at most one default value": "变量最多只能有一个默认值",
		"default value must be string, number, or boolean": "默认值必须是字符串、数字或布尔值",
		"no value specified": "没有指定值",
		"must have exactly one value": "必须正好有一个值",
		"missing required field 'startNode'": "缺少必需字段 'startNode'",
		"Duplicate top-level node": "重复的顶级节点",
		"Missing required top-level node 'meta'": "缺少必需的顶级节点 'meta'",
		"Missing 'env' block": "缺少 'env' 块",
		"no initial variables will be defined": "不会定义初始变量",
		"Missing required top-level node 'properties'": "缺少必需的顶级节点 'properties'",
		"Unknown top-level node": "未知的顶级节点"
	};

	let result = message;
	for (const [en, zh] of Object.entries(translations)) {
		if (message.includes(en)) {
			result = message.replace(en, zh);
			break;
		}
	}

	return result;
}

function formatError(error, filename, logger) {
	if (error instanceof KDLError) {
		const location = `${filename}:${error.line}:${error.column}`;

		if (!logger || logger.cLocale) {
			return `${location}: ${error.message}`;
		}

		const zhMessages = {
			'Expected value': '期望一个值，但是……',
			'Unexpected token': '遇到了意料之外的符号',
			'Unterminated string': '字符串没有闭合哦',
			'Invalid number': '这个数字格式不太对呢',
			'Missing closing brace': '少了一个右大括号 }',
			'Duplicate node': '重复的节点啦'
		};

		let zhMsg = error.message;
		for (const [enPattern, zhText] of Object.entries(zhMessages)) {
			if (error.message.includes(enPattern)) {
				zhMsg = error.message.replace(enPattern, zhText);
				break;
			}
		}

		return `${location}: ${zhMsg}`;
	}
	return error.message;
}

export async function compileKDL(inputPath, outputPath = 'configs.bin', logger = null) {
	const log = logger || {
		step: console.log,
		substep: console.log,
		warning: console.warn,
		error: console.error
	};

	try {
		log.step('Reading source file...');
		const source = fs.readFileSync(inputPath, 'utf-8');
		log.substep(`Loaded ${source.length} bytes from ${path.basename(inputPath)}`);

		log.step('Tokenizing...');
		const tokens = tokenize(source, inputPath);
		log.substep(`Generated ${tokens.length} tokens`);

		log.step('Parsing AST...');
		const ast = parse(tokens, source, inputPath);
		log.substep(`Built abstract syntax tree with ${ast.children.length} root nodes`);

		log.step('Validating semantics...');
		const validationResult = validate(ast);

		if (validationResult.warnings.length > 0) {
			for (const warning of validationResult.warnings) {
				const location = `${inputPath}:${warning.line}:${warning.column}`;
				const msg = logger.cLocale ? warning.message : translateValidationMessage(warning.message, false);
				log.warning(msg, location);
			}
		}

		if (!validationResult.valid) {
			for (const error of validationResult.errors) {
				const location = `${inputPath}:${error.line}:${error.column}`;
				const msg = logger.cLocale ? error.message : translateValidationMessage(error.message, true);
				log.error(msg, location);
			}
			throw new Error('Validation failed with errors');
		}

		log.substep('Semantic validation passed');

		log.step('Encoding to binary format...');
		const binary = encode(validationResult.data);
		log.substep(`Encoded ${binary.length} bytes (compression ratio: ${(binary.length / source.length * 100).toFixed(1)}%)`);

		log.step(`Writing to ${outputPath}...`);
		fs.writeFileSync(outputPath, binary);
		log.substep(`Successfully written ${binary.length} bytes`);

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
			const location = `${inputPath}:${error.line}:${error.column}`;
			const msg = logger.cLocale ? error.message : translateValidationMessage(error.message, true);
			log.error(msg, location);
		} else {
			log.error(error.message);
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
