/*
  File: imagecomp/index.js
  Revision number: 1
  License: GPL-3.0
  Copyleft (c) 2025-2026 ZhianTeam. All rights may not reserved.

  This is the image compression module for Usagi compiler.
  BandTwine is a FLOSS Software distributed under AGPL-3.0 license. This software comes with ABSOLUTELY NO WARRANTY.
  You are welcome to redistribute it under certain conditions. See the GNU Affero General Public License for more details.
*/

import fs from 'node:fs';
import path from 'node:path';
import { execSync } from 'node:child_process';

function checkImageMagick() {
	try {
		execSync('magick -version', { stdio: 'ignore' });
		return 'magick';
	} catch {
		try {
			execSync('convert -version', { stdio: 'ignore' });
			return 'convert';
		} catch {
			return null;
		}
	}
}

function compressWithImageMagick(inputPath, outputPath, command) {
	const ext = path.extname(inputPath).toLowerCase();

	let cmdArgs;
	if (ext === '.png') {
		cmdArgs = `"${inputPath}" -strip -define png:compression-level=9 -define png:compression-filter=5 -quality 100 "${outputPath}"`;
	} else if (ext === '.jpg' || ext === '.jpeg') {
		cmdArgs = `"${inputPath}" -strip -sampling-factor 4:2:0 -quality 85 -interlace JPEG "${outputPath}"`;
	} else if (ext === '.webp') {
		cmdArgs = `"${inputPath}" -strip -quality 90 -define webp:method=6 "${outputPath}"`;
	} else {
		fs.copyFileSync(inputPath, outputPath);
		return {
			originalSize: fs.statSync(inputPath).size,
			compressedSize: fs.statSync(outputPath).size,
			saved: 0
		};
	}

	try {
		execSync(`${command} ${cmdArgs}`, { stdio: 'ignore' });

		const originalSize = fs.statSync(inputPath).size;
		const compressedSize = fs.statSync(outputPath).size;
		const saved = originalSize - compressedSize;

		return {
			originalSize,
			compressedSize,
			saved,
			ratio: (compressedSize / originalSize * 100).toFixed(1)
		};
	} catch (err) {
		fs.copyFileSync(inputPath, outputPath);
		return {
			originalSize: fs.statSync(inputPath).size,
			compressedSize: fs.statSync(outputPath).size,
			saved: 0,
			error: err.message
		};
	}
}

export async function compressImages(inputDir, outputDir, logger = null) {
	const log = logger || {
		step: console.log,
		substep: console.log,
		warning: console.warn
	};

	const magickCmd = checkImageMagick();

	if (!magickCmd) {
		log.warning('ImageMagick not found, images will be copied without compression');
	} else {
		log.step('Compressing images...');
	}

	const imageExts = ['.png', '.jpg', '.jpeg', '.webp', '.gif', '.bmp'];
	const results = [];

	function processDirectory(dir, outDir) {
		if (!fs.existsSync(outDir)) {
			fs.mkdirSync(outDir, { recursive: true });
		}

		const entries = fs.readdirSync(dir, { withFileTypes: true });

		for (const entry of entries) {
			const inputPath = path.join(dir, entry.name);
			const outputPath = path.join(outDir, entry.name);

			if (entry.isDirectory()) {
				processDirectory(inputPath, outputPath);
			} else if (entry.isFile()) {
				const ext = path.extname(entry.name).toLowerCase();

				if (imageExts.includes(ext)) {
					if (magickCmd) {
						const result = compressWithImageMagick(inputPath, outputPath, magickCmd);
						results.push({
							file: entry.name,
							...result
						});

						if (result.saved > 0) {
							log.substep(`${entry.name}: ${result.originalSize} → ${result.compressedSize} bytes (${result.ratio}%)`);
						} else if (result.error) {
							log.warning(`Failed to compress ${entry.name}, using original`);
						}
					} else {
						fs.copyFileSync(inputPath, outputPath);
						results.push({
							file: entry.name,
							originalSize: fs.statSync(inputPath).size,
							compressedSize: fs.statSync(outputPath).size,
							saved: 0
						});
					}
				} else {
					fs.copyFileSync(inputPath, outputPath);
				}
			}
		}
	}

	processDirectory(inputDir, outputDir);

	const totalOriginal = results.reduce((sum, r) => sum + r.originalSize, 0);
	const totalCompressed = results.reduce((sum, r) => sum + r.compressedSize, 0);
	const totalSaved = totalOriginal - totalCompressed;

	if (magickCmd && totalSaved > 0) {
		log.substep(`Total: ${totalOriginal} → ${totalCompressed} bytes (saved ${totalSaved} bytes)`);
	}

	return {
		processed: results.length,
		totalOriginal,
		totalCompressed,
		totalSaved
	};
}
