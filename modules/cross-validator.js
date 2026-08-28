/*
	File: cross-validator.js
	Revision number: 1
	License: GPL-3.0
	Copyleft (c) 2025-2026 ZhianTeam. All rights may not reserved.

	Cross-reference validator for BandTwine Next. Validates startNode and story links.
	BandTwine is a FLOSS Software distributed under AGPL-3.0 license. This software comes with ABSOLUTELY NO WARRANTY.
	You are welcome to redistribute it under certain conditions. See the GNU Affero General Public License for more details.
*/

/*
	Validates cross-references between config.kdl and Twee files.
	Checks that startNode exists as a passage tag and all story links point to real passages.
	SugarCube standard: :: PassageName [tag1 tag2]
*/
export function validateCrossReferences(configData, tweePassages, logger) {
	const errors = [];
	const warnings = [];

	const startNode = configData?.properties?.startNode;
	if (startNode) {
		const startPassage = tweePassages.find(p =>
			p.tags && p.tags.includes(startNode)
		);

		if (!startPassage) {
			errors.push({
				message: `startNode '${startNode}' not found in any Twee file. ` +
					`Expected passage with tag [${startNode}] in header: :: PassageName [${startNode}]`,
				context: 'config.kdl:properties.startNode',
				cMessage: `startNode '${startNode}' 在 Twee 文件中找不到呢。` +
					`需要一个带有标签 [${startNode}] 的 passage：:: PassageName [${startNode}]`
			});
		}
	}

	const passageNames = new Set(tweePassages.map(p => p.name));

	/*
		SugarCube link formats:
		[[target]] - simple link
		[[text|target]] - link with display text
		[[text->target]] - alternative syntax
		[[text<-target]] - reverse syntax
	*/
	const linkRegex = /\[\[([^\]|<>-]+?)(?:\|([^\]]+?)|->([^\]]+?)|<-([^\]]+?))?\]\]/g;

	for (const passage of tweePassages) {
		let match;
		const content = passage.content || '';

		const regex = new RegExp(linkRegex.source, 'g');
		while ((match = regex.exec(content)) !== null) {
			let linkTarget;

			if (match[2]) {
				linkTarget = match[2].trim();
			} else if (match[3]) {
				linkTarget = match[3].trim();
			} else if (match[4]) {
				linkTarget = match[4].trim();
			} else {
				linkTarget = match[1].trim();
			}

			if (!passageNames.has(linkTarget)) {
				warnings.push({
					message: `Broken link: '${linkTarget}' not found`,
					context: `${passage.sourceFile}:${passage.name}`,
					cMessage: `链接断了：找不到 '${linkTarget}'`,
					cContext: `${passage.sourceFile}:${passage.name}`
				});
			}
		}
	}

	return { errors, warnings };
}
