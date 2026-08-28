/*
	File: cross-validator.test.js
	Revision number: 1
	License: GPL-3.0
	Copyleft (c) 2025-2026 ZhianTeam. All rights may not reserved.

	Tests for cross-reference validation between config.kdl and Twee files.
	BandTwine is a FLOSS Software distributed under AGPL-3.0 license. This software comes with ABSOLUTELY NO WARRANTY.
	You are welcome to redistribute it under certain conditions. See the GNU Affero General Public License for more details.
*/

import { describe, it } from 'node:test';
import assert from 'node:assert';
import { validateCrossReferences } from '../cross-validator.js';

describe('validateCrossReferences', () => {
	it('passes when startNode exists as passage tag', () => {
		const configData = {
			properties: {
				startNode: 'start'
			}
		};

		const passages = [
			{
				name: 'Introduction',
				tags: ['start'],
				content: 'Welcome to the story.',
				sourceFile: 'story.twee'
			}
		];

		const result = validateCrossReferences(configData, passages, null);

		assert.strictEqual(result.errors.length, 0);
		assert.strictEqual(result.warnings.length, 0);
	});

	it('errors when startNode missing from passages', () => {
		const configData = {
			properties: {
				startNode: 'missing'
			}
		};

		const passages = [
			{
				name: 'Introduction',
				tags: ['start'],
				content: 'Welcome to the story.',
				sourceFile: 'story.twee'
			}
		];

		const result = validateCrossReferences(configData, passages, null);

		assert.strictEqual(result.errors.length, 1);
		assert.ok(result.errors[0].message.includes("startNode 'missing' not found"));
		assert.strictEqual(result.errors[0].context, 'config.kdl:properties.startNode');
	});

	it('warns when link target does not exist', () => {
		const configData = {
			properties: {
				startNode: 'start'
			}
		};

		const passages = [
			{
				name: 'Introduction',
				tags: ['start'],
				content: 'Go to [[Next Scene]]',
				sourceFile: 'story.twee'
			}
		];

		const result = validateCrossReferences(configData, passages, null);

		assert.strictEqual(result.errors.length, 0);
		assert.strictEqual(result.warnings.length, 1);
		assert.ok(result.warnings[0].message.includes("Broken link: 'Next Scene' not found"));
		assert.strictEqual(result.warnings[0].context, 'story.twee:Introduction');
	});

	it('validates pipe-style links [[text|target]]', () => {
		const configData = {
			properties: {
				startNode: 'start'
			}
		};

		const passages = [
			{
				name: 'Introduction',
				tags: ['start'],
				content: 'Go [[click here|Missing Target]]',
				sourceFile: 'story.twee'
			}
		];

		const result = validateCrossReferences(configData, passages, null);

		assert.strictEqual(result.warnings.length, 1);
		assert.ok(result.warnings[0].message.includes("Broken link: 'Missing Target' not found"));
	});

	it('validates arrow-style links [[text->target]]', () => {
		const configData = {
			properties: {
				startNode: 'start'
			}
		};

		const passages = [
			{
				name: 'Introduction',
				tags: ['start'],
				content: 'Go [[click here->Missing Target]]',
				sourceFile: 'story.twee'
			}
		];

		const result = validateCrossReferences(configData, passages, null);

		assert.strictEqual(result.warnings.length, 1);
		assert.ok(result.warnings[0].message.includes("Broken link: 'Missing Target' not found"));
	});

	it('validates reverse arrow-style links [[text<-target]]', () => {
		const configData = {
			properties: {
				startNode: 'start'
			}
		};

		const passages = [
			{
				name: 'Introduction',
				tags: ['start'],
				content: 'Go [[click here<-Missing Target]]',
				sourceFile: 'story.twee'
			}
		];

		const result = validateCrossReferences(configData, passages, null);

		assert.strictEqual(result.warnings.length, 1);
		assert.ok(result.warnings[0].message.includes("Broken link: 'Missing Target' not found"));
	});

	it('passes when all links point to existing passages', () => {
		const configData = {
			properties: {
				startNode: 'start'
			}
		};

		const passages = [
			{
				name: 'Introduction',
				tags: ['start'],
				content: 'Go to [[Next Scene]] or [[click here|Another Scene]]',
				sourceFile: 'story.twee'
			},
			{
				name: 'Next Scene',
				tags: [],
				content: 'This is the next scene.',
				sourceFile: 'story.twee'
			},
			{
				name: 'Another Scene',
				tags: [],
				content: 'This is another scene.',
				sourceFile: 'story.twee'
			}
		];

		const result = validateCrossReferences(configData, passages, null);

		assert.strictEqual(result.errors.length, 0);
		assert.strictEqual(result.warnings.length, 0);
	});

	it('handles multiple broken links in same passage', () => {
		const configData = {
			properties: {
				startNode: 'start'
			}
		};

		const passages = [
			{
				name: 'Introduction',
				tags: ['start'],
				content: 'Go to [[Missing1]] or [[Missing2]] or [[text|Missing3]]',
				sourceFile: 'story.twee'
			}
		];

		const result = validateCrossReferences(configData, passages, null);

		assert.strictEqual(result.warnings.length, 3);
		assert.ok(result.warnings[0].message.includes("Broken link: 'Missing1'"));
		assert.ok(result.warnings[1].message.includes("Broken link: 'Missing2'"));
		assert.ok(result.warnings[2].message.includes("Broken link: 'Missing3'"));
	});

	it('handles passages without tags', () => {
		const configData = {
			properties: {
				startNode: 'start'
			}
		};

		const passages = [
			{
				name: 'Introduction',
				content: 'Welcome to the story.',
				sourceFile: 'story.twee'
			}
		];

		const result = validateCrossReferences(configData, passages, null);

		assert.strictEqual(result.errors.length, 1);
	});

	it('handles passages without content', () => {
		const configData = {
			properties: {
				startNode: 'start'
			}
		};

		const passages = [
			{
				name: 'Introduction',
				tags: ['start'],
				sourceFile: 'story.twee'
			}
		];

		const result = validateCrossReferences(configData, passages, null);

		assert.strictEqual(result.errors.length, 0);
		assert.strictEqual(result.warnings.length, 0);
	});

	it('handles missing startNode in config', () => {
		const configData = {
			properties: {}
		};

		const passages = [
			{
				name: 'Introduction',
				tags: ['start'],
				content: 'Welcome.',
				sourceFile: 'story.twee'
			}
		];

		const result = validateCrossReferences(configData, passages, null);

		assert.strictEqual(result.errors.length, 0);
	});
});
