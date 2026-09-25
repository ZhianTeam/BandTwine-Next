/*
	File: personality.js
	Revision number: 2
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
			`嗯…找不到 ${context.field || '这个字段'} 欸… ${randomMood('worried')}`,
			`咦，${context.field || '这个'} 跑哪里去了？ ${randomMood('worried')}`,
			`我在找 ${context.field || '某个东西'}，但它不在这里… ${randomMood('pout')}`,
			`${context.field || '这个字段'} 好像不见了 ${randomMood('thinking')}`
		],
		'invalid-format': [
			`这个 ${context.field || '值'} 看起来有点奇怪欸 ${randomMood('pout')}`,
			`我不太确定这个 ${context.field || '格式'}… ${randomMood('thinking')}`,
			`嗯，${context.field || '这个'} 好像不太对劲 ${randomMood('worried')}`,
			`${context.field || '这个'} 跟预期的不太一样呢 ${randomMood('pout')}`
		],
		'deprecated': [
			`哦！${context.field || '这个'} 已经过时啦 ${randomMood('worried')}`,
			`嘘…${context.field || '这个'} 在未来版本里不能用了哦！ ${randomMood('worried')}`,
			`${context.field || '这个'} 太老了，最好更新一下 ${randomMood('thinking')}`,
			`未来版本不会再支持 ${context.field || '这个'} 了 ${randomMood('pout')}`
		],
		'unknown-node': [
			`我不认识这个节点… ${randomMood('thinking')}`,
			`这个节点不在我的 schema 里 ${randomMood('worried')}`,
			`嗯，从来没见过这个节点 ${randomMood('pout')}`
		],
		'validation': [
			`这里有些地方检查不通过 ${randomMood('worried')}`,
			`我在验证这个的时候遇到了困难 ${randomMood('pout')}`,
			`这个没通过我的检查 ${randomMood('thinking')}`
		]
	};

	const messages = templates[type] || templates['validation'];
	return randomFrom(messages);
}

export function expressError(type, context = {}) {
	const templates = {
		'parse-error': [
			`我没法解析这个… ${randomMood('sad')}`,
			`语法错误！我糊涂了 ${randomMood('sad')}`,
			`解析器在这里停下了 ${randomMood('sad')}`,
			`有什么东西把我的解析器弄坏了 ${randomMood('sad')}`
		],
		'validation-error': [
			`这个不行，抱歉 ${randomMood('sad')}`,
			`我不能接受这个配置 ${randomMood('sad')}`,
			`验证在这里失败了 ${randomMood('sad')}`,
			`没法用这个设置继续下去 ${randomMood('sad')}`
		],
		'missing-required': [
			`${context.field || '这个字段'} 是必需的！我需要它才能继续 ${randomMood('sad')}`,
			`没有 ${context.field || '这个'}，我没法继续… ${randomMood('sad')}`,
			`${context.field || '这个'} 必须提供 ${randomMood('sad')}`,
			`我真的需要 ${context.field || '这个字段'} 来编译 ${randomMood('sad')}`
		],
		'file-error': [
			`找不到文件 ${randomMood('sad')}`,
			`文件不存在… ${randomMood('sad')}`,
			`我到处找了但找不到它 ${randomMood('sad')}`
		],
		'device-error': [
			`这个设备不支持这个功能 ${randomMood('sad')}`,
			`设备配置不兼容 ${randomMood('sad')}`,
			`目标设备缺少必需的能力 ${randomMood('sad')}`
		]
	};

	const messages = templates[type] || templates['validation-error'];
	return randomFrom(messages);
}

export function expressSuccess() {
	const messages = [
		`编译成功啦！ ${randomMood('happy')}`,
		`全部完成！好开心 ${randomMood('happy')}`,
		`成功！一切看起来都很完美 ${randomMood('happy')}`,
		`构建成功！ ${randomMood('happy')}`,
		`完美！没有发现错误 ${randomMood('happy')}`,
		`耶！编译完成 ${randomMood('happy')}`
	];

	return randomFrom(messages);
}

export function expressProgress(step) {
	const templates = {
		'reading': [
			'正在读取配置文件…',
			'加载配置文件中…',
			'解析配置中…'
		],
		'tokenizing': [
			'词法分析中…快好了！',
			'正在拆解语法…',
			'扫描 token 中…'
		],
		'parsing': [
			'解析结构中…',
			'构建语法树…',
			'分析代码中…'
		],
		'validating': [
			'验证所有内容…',
			'运行检查中…',
			'确保一切正常…'
		],
		'encoding': [
			'编码成二进制…让它变小小！',
			'压缩数据中…',
			'创建 BTNC 格式…'
		],
		'writing': [
			'写入输出文件…',
			'保存编译后的二进制文件…',
			'生成包文件…'
		]
	};

	const messages = templates[step] || ['处理中…'];
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
