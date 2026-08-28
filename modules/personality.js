/*
	File: personality.js
	Revision number: 1
	License: GPL-3.0
	Copyleft (c) 2025-2026 ZhianTeam. All rights may not reserved.

	Usagi's personality engine: makes compiler messages cute and memorable.
	BandTwine is a FLOSS Software distributed under AGPL-3.0 license. This software comes with ABSOLUTELY NO WARRANTY.
	You are welcome to redistribute it under certain conditions. See the GNU Affero General Public License for more details.
*/

const MOODS = {
	happy: ['(｡♥‿♥｡)', '(◕‿◕✿)', '(✿◠‿◠)', '(◠‿◠✿)', '(´｡• ᵕ •｡`)'],
	worried: ['(´・ω・`)', '(◞‸◟)', '(｡•́︿•̀｡)', '(・_・;)', '(๑•́ ₃ •̀๑)'],
	pout: ['(,,>ヮ<,,)', '(>^ω^<)', '(,,Ծ‸Ծ,,)', '(´・ω・`)', '(｡•́︿•̀｡)'],
	sad: ['(╥﹏╥)', '(ಥ﹏ಥ)', '(｡•́︿•̀｡)', '(T_T)', '(；′⌒`)'],
	thinking: ['(｡•̀ᴗ-)✧', '(*・ω・)', '(・・?)', '(｡･ω･｡)', '(っ˘ω˘ς )']
};

function randomFrom(arr) {
	return arr[Math.floor(Math.random() * arr.length)];
}

function randomMood(mood) {
	return randomFrom(MOODS[mood]);
}

export function expressWarning(type, context = {}) {
	const templates = {
		'missing-field': [
			`Hmm, I can't find ${context.field || 'this field'}... ${randomMood('worried')}`,
			`Wait, where's ${context.field || 'this'}? ${randomMood('worried')}`,
			`I'm looking for ${context.field || 'something'} but it's not here... ${randomMood('pout')}`,
			`${context.field || 'This field'} seems to be missing ${randomMood('thinking')}`
		],
		'invalid-format': [
			`This ${context.field || 'value'} looks a bit off to me ${randomMood('pout')}`,
			`I'm not sure about this ${context.field || 'format'}... ${randomMood('thinking')}`,
			`Hmm, ${context.field || 'this'} doesn't seem quite right ${randomMood('worried')}`,
			`Something's not matching up with ${context.field || 'this'} ${randomMood('pout')}`
		],
		'deprecated': [
			`Oh! ${context.field || 'This'} is deprecated now ${randomMood('worried')}`,
			`Psst... ${context.field || 'this'} won't work in future versions! ${randomMood('worried')}`,
			`${context.field || 'This'} is getting old, better update it ${randomMood('thinking')}`,
			`Future versions won't support ${context.field || 'this'} anymore ${randomMood('pout')}`
		],
		'unknown-node': [
			`I don't recognize this node... ${randomMood('thinking')}`,
			`This node isn't in my schema ${randomMood('worried')}`,
			`Hmm, never seen this node before ${randomMood('pout')}`
		],
		'validation': [
			`Something doesn't check out here ${randomMood('worried')}`,
			`I'm having trouble validating this ${randomMood('pout')}`,
			`This didn't pass my checks ${randomMood('thinking')}`
		]
	};

	const messages = templates[type] || templates['validation'];
	return randomFrom(messages);
}

export function expressError(type, context = {}) {
	const templates = {
		'parse-error': [
			`I can't parse this... ${randomMood('sad')}`,
			`Syntax error! I'm confused ${randomMood('sad')}`,
			`The parser stopped here ${randomMood('sad')}`,
			`Something broke my parser ${randomMood('sad')}`
		],
		'validation-error': [
			`This won't work, sorry ${randomMood('sad')}`,
			`I can't accept this configuration ${randomMood('sad')}`,
			`Validation failed here ${randomMood('sad')}`,
			`Can't proceed with this setup ${randomMood('sad')}`
		],
		'missing-required': [
			`${context.field || 'This field'} is required! I need it to continue ${randomMood('sad')}`,
			`Without ${context.field || 'this'}, I can't go on... ${randomMood('sad')}`,
			`${context.field || 'This'} must be provided ${randomMood('sad')}`,
			`I really need ${context.field || 'this field'} to compile ${randomMood('sad')}`
		],
		'file-error': [
			`Can't find the file ${randomMood('sad')}`,
			`File not found... ${randomMood('sad')}`,
			`I looked everywhere but can't find it ${randomMood('sad')}`
		],
		'device-error': [
			`This device doesn't support this feature ${randomMood('sad')}`,
			`Incompatible device configuration ${randomMood('sad')}`,
			`Target device lacks required capabilities ${randomMood('sad')}`
		]
	};

	const messages = templates[type] || templates['validation-error'];
	return randomFrom(messages);
}

export function expressSuccess() {
	const messages = [
		`Compilation succeeded! ${randomMood('happy')}`,
		`All done! That was fun ${randomMood('happy')}`,
		`Success! Everything looks perfect ${randomMood('happy')}`,
		`Built successfully! ${randomMood('happy')}`,
		`Perfect! No errors found ${randomMood('happy')}`,
		`Yay! Compilation complete ${randomMood('happy')}`
	];

	return randomFrom(messages);
}

export function expressProgress(step) {
	const templates = {
		'reading': [
			'Reading configuration...',
			'Loading config files...',
			'Parsing configuration...'
		],
		'tokenizing': [
			'Tokenizing... almost there!',
			'Breaking down the syntax...',
			'Scanning tokens...'
		],
		'parsing': [
			'Parsing structure...',
			'Building syntax tree...',
			'Analyzing code...'
		],
		'validating': [
			'Validating everything...',
			'Running checks...',
			'Making sure it all works...'
		],
		'encoding': [
			'Encoding to binary... making it tiny!',
			'Compressing data...',
			'Creating BTNC format...'
		],
		'writing': [
			'Writing output files...',
			'Saving compiled binary...',
			'Generating package...'
		]
	};

	const messages = templates[step] || ['Processing...'];
	const base = randomFrom(messages);

	if (Math.random() < 0.3) {
		return `${base} ${randomMood('thinking')}`;
	}

	return base;
}

export function enhanceMessage(message, level, cLocale) {
	if (cLocale) {
		return message;
	}

	if (Math.random() > 0.3) {
		return message;
	}

	const lowerMsg = message.toLowerCase();

	if (level === 'warning') {
		if (lowerMsg.includes('missing') || lowerMsg.includes('not found')) {
			return expressWarning('missing-field', { field: extractFieldName(message) });
		} else if (lowerMsg.includes('invalid') || lowerMsg.includes('format')) {
			return expressWarning('invalid-format', { field: extractFieldName(message) });
		} else if (lowerMsg.includes('deprecated')) {
			return expressWarning('deprecated', { field: extractFieldName(message) });
		} else if (lowerMsg.includes('unknown') || lowerMsg.includes('unrecognized')) {
			return expressWarning('unknown-node');
		}
		return expressWarning('validation');
	}

	if (level === 'error') {
		if (lowerMsg.includes('parse') || lowerMsg.includes('syntax')) {
			return expressError('parse-error');
		} else if (lowerMsg.includes('required')) {
			return expressError('missing-required', { field: extractFieldName(message) });
		} else if (lowerMsg.includes('file') || lowerMsg.includes('not found')) {
			return expressError('file-error');
		} else if (lowerMsg.includes('device') || lowerMsg.includes('unsupported')) {
			return expressError('device-error');
		}
		return expressError('validation-error');
	}

	return message;
}

function extractFieldName(message) {
	const quoted = message.match(/['"`]([^'"`]+)['"`]/);
	if (quoted) {
		return quoted[1];
	}

	const afterColon = message.match(/:\s*(\w+)/);
	if (afterColon) {
		return afterColon[1];
	}

	const words = message.split(/\s+/);
	if (words.length > 2) {
		return words[words.length - 1];
	}

	return 'this';
}
