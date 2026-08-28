/*
	File: modules/__tests__/e2e.test.js
	Revision number: 1
	License: GPL-3.0
	Copyleft (c) 2025-2026 ZhianTeam. All rights may not reserved.

	End-to-end tests for complete RPK build.
	BandTwine is a FLOSS Software distributed under GPL-3.0 license. This software comes with ABSOLUTELY NO WARRANTY.
	You are welcome to redistribute it under certain conditions. See the GNU General Public License for more details.
*/

import { describe, it } from 'node:test';
import assert from 'node:assert';
import { exec } from 'node:child_process';
import { promisify } from 'node:util';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const execAsync = promisify(exec);
const __dirname = path.dirname(fileURLToPath(import.meta.url));
const projectRoot = path.resolve(__dirname, '../..');

describe('E2E: Full RPK Build', () => {
	describe('Minimal Story Build', () => {
		it('should compile minimal story to RPK', async () => {
			const testDir = path.join(projectRoot, 'test-fixtures', 'minimal-story');
			const distDir = path.join(testDir, 'dist');

			const { stdout, stderr } = await execAsync(
				`node ${path.join(projectRoot, 'modules/usagi.js')} --path ${testDir} build -v`,
				{ timeout: 30000 }
			);

			const rpkPath = path.join(distDir, 'com.example.minimal.rpk');
			assert.ok(fs.existsSync(rpkPath), 'RPK file not generated');

			const stats = fs.statSync(rpkPath);
			assert.ok(stats.size > 1000, 'RPK too small (< 1KB)');
			assert.ok(stats.size < 5000000, 'RPK too large (> 5MB)');
		});

		it('should generate manifest.json', async () => {
			const testDir = path.join(projectRoot, 'test-fixtures', 'minimal-story');
			const distDir = path.join(testDir, 'dist');

			await execAsync(
				`node ${path.join(projectRoot, 'modules/usagi.js')} --path ${testDir} build -v`,
				{ timeout: 30000 }
			);

			const manifestPath = path.join(distDir, 'manifest.json');
			assert.ok(fs.existsSync(manifestPath), 'manifest.json not generated');

			const manifestContent = fs.readFileSync(manifestPath, 'utf8');
			const manifest = JSON.parse(manifestContent);

			assert.strictEqual(manifest.package, 'com.example.minimal');
			assert.ok(manifest.name);
			assert.ok(manifest.versionName);
		});

		it('should generate story.btnc', async () => {
			const testDir = path.join(projectRoot, 'test-fixtures', 'minimal-story');
			const distDir = path.join(testDir, 'dist');

			await execAsync(
				`node ${path.join(projectRoot, 'modules/usagi.js')} --path ${testDir} build -v`,
				{ timeout: 30000 }
			);

			const btncPath = path.join(distDir, 'story.btnc');
			assert.ok(fs.existsSync(btncPath), 'story.btnc not generated');

			const btnc = fs.readFileSync(btncPath);
			const magic = btnc.toString('ascii', 0, 4);
			assert.strictEqual(magic, 'BTNC', 'Invalid BTNC magic bytes');

			const view = new DataView(btnc.buffer, btnc.byteOffset, btnc.byteLength);
			const version = view.getUint16(4, false);
			assert.ok(version >= 1, 'Invalid BTNC version');
		});

		it('should generate story.btsc', async () => {
			const testDir = path.join(projectRoot, 'test-fixtures', 'minimal-story');
			const distDir = path.join(testDir, 'dist');

			await execAsync(
				`node ${path.join(projectRoot, 'modules/usagi.js')} --path ${testDir} build -v`,
				{ timeout: 30000 }
			);

			const btscPath = path.join(distDir, 'story.btsc');
			assert.ok(fs.existsSync(btscPath), 'story.btsc not generated');

			const btsc = fs.readFileSync(btscPath);
			const magic = btsc.toString('ascii', 0, 4);
			assert.strictEqual(magic, 'BTSC', 'Invalid BTSC magic bytes');

			const view = new DataView(btsc.buffer, btsc.byteOffset, btsc.byteLength);
			const version = view.getUint16(4, false);
			assert.ok(version >= 1, 'Invalid BTSC version');
		});
	});

	describe('Build Validation', () => {
		it('should fail on missing config.kdl', async () => {
			const invalidDir = path.join(projectRoot, 'test-fixtures', 'invalid-no-config');

			try {
				await execAsync(
					`node ${path.join(projectRoot, 'modules/usagi.js')} --path ${invalidDir} build`,
					{ timeout: 10000 }
				);
				assert.fail('Should have thrown error for missing config.kdl');
			} catch (error) {
				assert.ok(error.message.includes('config.kdl') || error.code !== 0);
			}
		});

		it('should fail on invalid KDL syntax', async () => {
			const invalidDir = path.join(projectRoot, 'test-fixtures', 'invalid-kdl-syntax');

			try {
				await execAsync(
					`node ${path.join(projectRoot, 'modules/usagi.js')} --path ${invalidDir} build`,
					{ timeout: 10000 }
				);
				assert.fail('Should have thrown error for invalid KDL syntax');
			} catch (error) {
				assert.ok(error.code !== 0);
			}
		});
	});

	describe('Verbose Mode', () => {
		it('should output build logs in verbose mode', async () => {
			const testDir = path.join(projectRoot, 'test-fixtures', 'minimal-story');

			const { stdout, stderr } = await execAsync(
				`node ${path.join(projectRoot, 'modules/usagi.js')} --path ${testDir} build -v`,
				{ timeout: 30000 }
			);

			const output = stdout + stderr;
			assert.ok(output.length > 0, 'No output in verbose mode');
		});
	});

	describe('Incremental Build', () => {
		it('should rebuild on subsequent invocations', async () => {
			const testDir = path.join(projectRoot, 'test-fixtures', 'minimal-story');
			const distDir = path.join(testDir, 'dist');
			const rpkPath = path.join(distDir, 'com.example.minimal.rpk');

			await execAsync(
				`node ${path.join(projectRoot, 'modules/usagi.js')} --path ${testDir} build`,
				{ timeout: 30000 }
			);

			const firstStats = fs.statSync(rpkPath);
			const firstMtime = firstStats.mtime.getTime();

			await new Promise(resolve => setTimeout(resolve, 1000));

			await execAsync(
				`node ${path.join(projectRoot, 'modules/usagi.js')} --path ${testDir} build`,
				{ timeout: 30000 }
			);

			const secondStats = fs.statSync(rpkPath);
			const secondMtime = secondStats.mtime.getTime();

			assert.ok(secondMtime >= firstMtime, 'RPK not rebuilt');
		});
	});

	describe('File Structure', () => {
		it('should create dist directory', async () => {
			const testDir = path.join(projectRoot, 'test-fixtures', 'minimal-story');
			const distDir = path.join(testDir, 'dist');

			await execAsync(
				`node ${path.join(projectRoot, 'modules/usagi.js')} --path ${testDir} build`,
				{ timeout: 30000 }
			);

			assert.ok(fs.existsSync(distDir), 'dist directory not created');
			assert.ok(fs.statSync(distDir).isDirectory(), 'dist is not a directory');
		});

		it('should include all required files in RPK', async () => {
			const testDir = path.join(projectRoot, 'test-fixtures', 'minimal-story');
			const distDir = path.join(testDir, 'dist');

			await execAsync(
				`node ${path.join(projectRoot, 'modules/usagi.js')} --path ${testDir} build`,
				{ timeout: 30000 }
			);

			const requiredFiles = [
				'manifest.json',
				'story.btnc',
				'story.btsc'
			];

			for (const file of requiredFiles) {
				const filePath = path.join(distDir, file);
				assert.ok(fs.existsSync(filePath), `Missing required file: ${file}`);
			}
		});
	});

	describe('Error Handling', () => {
		it('should exit with non-zero code on error', async () => {
			const invalidDir = path.join(projectRoot, 'test-fixtures', 'nonexistent');

			try {
				await execAsync(
					`node ${path.join(projectRoot, 'modules/usagi.js')} --path ${invalidDir} build`,
					{ timeout: 10000 }
				);
				assert.fail('Should have exited with error');
			} catch (error) {
				assert.ok(error.code !== 0);
			}
		});
	});
});
