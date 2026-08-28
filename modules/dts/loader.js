/*
	File: dts/loader.js
	Revision number: 1
	License: GPL-3.0
	Copyleft (c) 2025-2026 ZhianTeam. All rights may not reserved.

	Devicetree loader for Usagi compiler.
	BandTwine is a FLOSS Software distributed under AGPL-3.0 license. This software comes with ABSOLUTELY NO WARRANTY.
	You are welcome to redistribute it under certain conditions. See the GNU Affero General Public License for more details.
*/

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { tokenize } from '../kdlcomp/src/lexer.js';
import { parse } from '../kdlcomp/src/parser.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

function getArgValue(node) {
	if (!node || !node.arguments || node.arguments.length === 0) return undefined;
	return node.arguments[0].value;
}

function getAllArgValues(node) {
	if (!node || !node.arguments) return [];
	return node.arguments.map(a => a.value);
}

function findChild(node, name) {
	if (!node || !node.children) return null;
	return node.children.find(c => !c.disabled && c.name === name);
}

function parseDeviceNode(node) {
	const pretty = getArgValue(findChild(node, 'pretty'));
	const systemNode = findChild(node, 'system');
	const jsNode = findChild(node, 'js');
	const apiNode = findChild(node, 'api');

	const apiLevel = systemNode ? getArgValue(findChild(systemNode, 'api')) : null;
	const platform = systemNode ? getArgValue(findChild(systemNode, 'platform')) : null;

	const capabilities = new Set();

	if (apiNode) {
		if (findChild(apiNode, 'crypto')) capabilities.add('crypto');
		if (findChild(apiNode, 'interconnect')) capabilities.add('interconnect');
		if (findChild(apiNode, 'fetch')) capabilities.add('fetch');
		if (findChild(apiNode, 'bluetooth')) capabilities.add('bluetooth');
		if (findChild(apiNode, 'geolocation')) capabilities.add('geolocation');
		if (findChild(apiNode, 'sensor')) capabilities.add('sensor');
	}

	const jsAbility = jsNode ? getArgValue(findChild(jsNode, 'ability')) : null;
	const jscSupported = jsAbility && (jsAbility === 'compiled' || jsAbility.includes('compiled'));
	const pbfSupported = jsAbility && (jsAbility === 'protobuf' || jsAbility.includes('protobuf'));

	const jscDefault = jscSupported && platform && platform >= 1200;
	const pbfDefault = pbfSupported && apiLevel && apiLevel >= 2;

	return {
		codename: node.name,
		pretty: pretty || node.name,
		apiLevel: apiLevel,
		platform: platform,
		capabilities: capabilities,
		jscDefault: jscDefault,
		pbfDefault: pbfDefault
	};
}

export function loadDeviceTree() {
	const dtsPath = path.join(__dirname, 'devicetree.dts.kdl');

	if (!fs.existsSync(dtsPath)) {
		throw new Error(`Devicetree file not found: ${dtsPath}`);
	}

	const source = fs.readFileSync(dtsPath, 'utf8');
	const tokens = tokenize(source, 'devicetree.dts.kdl');
	const ast = parse(tokens, source, 'devicetree.dts.kdl');

	const devices = {};

	for (const node of ast.children) {
		if (!node.disabled) {
			devices[node.name] = parseDeviceNode(node);
		}
	}

	return devices;
}

export function validateDeviceCodename(codename, deviceTree) {
	if (!deviceTree[codename]) {
		const available = Object.keys(deviceTree).sort().join(', ');
		throw new Error(
			`Unknown device codename: '${codename}'\n` +
			`Available devices: ${available}`
		);
	}
	return deviceTree[codename];
}

export function validateDeviceCapability(devices, capability, deviceTree) {
	const unsupported = [];

	for (const codename of devices) {
		const device = deviceTree[codename];
		if (!device.capabilities.has(capability)) {
			unsupported.push(`${codename} (${device.pretty})`);
		}
	}

	return unsupported;
}
