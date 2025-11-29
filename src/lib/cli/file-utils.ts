import { existsSync, readFileSync, writeFileSync } from 'fs';
import { join, resolve } from 'path';

export interface SvelteFileAnalysis {
	hasScriptTag: boolean;
	scriptTagStart: number; // Position in file where script tag starts
	scriptTagEnd: number; // Position in file where script tag ends
	scriptContentStart: number; // Position where script content starts (after <script> or <script lang="ts">)
	scriptContentEnd: number; // Position where script content ends (before </script>)
	hasCreateBayImport: boolean;
	hasSvelteBayImport: boolean;
	svelteBayImportLine?: string; // The full import line if exists
	svelteBayImportStart?: number; // Position where the import statement starts
	svelteBayImportEnd?: number; // Position where the import statement ends
	hasCreateBayCall: boolean;
}

/**
 * Find the SvelteKit project root by looking for svelte.config.js/ts
 */
export function findSvelteKitRoot(startDir: string = process.cwd()): string | null {
	let currentDir = resolve(startDir);
	const root = resolve('/');

	while (currentDir !== root) {
		if (
			existsSync(join(currentDir, 'svelte.config.js')) ||
			existsSync(join(currentDir, 'svelte.config.ts'))
		) {
			return currentDir;
		}
		currentDir = resolve(currentDir, '..');
	}

	return null;
}

/**
 * Find the root +layout.svelte file
 */
export function findRootLayout(projectRoot: string): string | null {
	// Common SvelteKit structure
	const possiblePaths = [
		join(projectRoot, 'src', 'routes', '+layout.svelte'),
		join(projectRoot, 'src', '+layout.svelte'),
		join(projectRoot, 'routes', '+layout.svelte')
	];

	for (const path of possiblePaths) {
		if (existsSync(path)) {
			return path;
		}
	}

	return null;
}

/**
 * Analyze a Svelte file to determine its structure and imports
 */
export function analyzeSvelteFile(filePath: string): SvelteFileAnalysis {
	const content = readFileSync(filePath, 'utf-8');

	const analysis: SvelteFileAnalysis = {
		hasScriptTag: false,
		scriptTagStart: -1,
		scriptTagEnd: -1,
		scriptContentStart: -1,
		scriptContentEnd: -1,
		hasCreateBayImport: false,
		hasSvelteBayImport: false,
		hasCreateBayCall: false
	};

	// Find script tag (including possible lang attribute)
	const scriptTagRegex = /<script(\s+[^>]*)?>/i;
	const scriptTagMatch = content.match(scriptTagRegex);

	if (scriptTagMatch) {
		analysis.hasScriptTag = true;
		analysis.scriptTagStart = scriptTagMatch.index!;
		analysis.scriptContentStart = scriptTagMatch.index! + scriptTagMatch[0].length;

		// Find closing script tag
		const closeScriptRegex = /<\/script>/i;
		const closeScriptMatch = content.slice(analysis.scriptContentStart).match(closeScriptRegex);

		if (closeScriptMatch) {
			analysis.scriptContentEnd = analysis.scriptContentStart + closeScriptMatch.index!;
			analysis.scriptTagEnd = analysis.scriptContentEnd + closeScriptMatch[0].length;

			// Extract script content
			const scriptContent = content.slice(analysis.scriptContentStart, analysis.scriptContentEnd);

			// Check for svelte-bay imports
			const importRegex = /import\s+{([^}]+)}\s+from\s+['"]svelte-bay['"]/;
			const importMatch = scriptContent.match(importRegex);

			if (importMatch) {
				analysis.hasSvelteBayImport = true;
				analysis.svelteBayImportLine = importMatch[0];
				analysis.svelteBayImportStart = analysis.scriptContentStart + importMatch.index!;
				analysis.svelteBayImportEnd = analysis.svelteBayImportStart + importMatch[0].length;

				// Check if createBay is in the import
				const imports = importMatch[1].split(',').map((s) => s.trim());
				analysis.hasCreateBayImport = imports.includes('createBay');
			}

			// Check for createBay() call
			analysis.hasCreateBayCall = /createBay\s*\(\s*\)/.test(scriptContent);
		}
	}

	return analysis;
}

/**
 * Create a new +layout.svelte file with createBay setup
 */
export function createLayoutWithBay(filePath: string): void {
	const content = `<script>
	import { createBay } from 'svelte-bay';

	createBay();
</script>

<slot />
`;

	writeFileSync(filePath, content, 'utf-8');
}

/**
 * Add script tag with createBay to existing layout
 */
export function addScriptTagWithBay(filePath: string): void {
	const content = readFileSync(filePath, 'utf-8');

	const newContent = `<script>
	import { createBay } from 'svelte-bay';

	createBay();
</script>

${content}`;

	writeFileSync(filePath, newContent, 'utf-8');
}

/**
 * Add createBay import to existing script tag
 */
export function addCreateBayImport(filePath: string, analysis: SvelteFileAnalysis): void {
	const content = readFileSync(filePath, 'utf-8');

	if (analysis.hasSvelteBayImport && analysis.svelteBayImportStart !== undefined) {
		// Add createBay to existing svelte-bay import
		const before = content.slice(0, analysis.svelteBayImportStart);
		const importStatement = content.slice(analysis.svelteBayImportStart, analysis.svelteBayImportEnd);
		const after = content.slice(analysis.svelteBayImportEnd);

		// Extract existing imports
		const importMatch = importStatement.match(/import\s+{([^}]+)}\s+from\s+['"]svelte-bay['"]/);
		if (importMatch) {
			const existingImports = importMatch[1].trim();
			const newImportStatement = `import { createBay, ${existingImports} } from 'svelte-bay'`;

			writeFileSync(filePath, before + newImportStatement + after, 'utf-8');
		}
	} else {
		// Add new import at the beginning of the script
		const before = content.slice(0, analysis.scriptContentStart);
		const scriptContent = content.slice(analysis.scriptContentStart);

		const newImport = `\n\timport { createBay } from 'svelte-bay';`;
		writeFileSync(filePath, before + newImport + scriptContent, 'utf-8');
	}
}

/**
 * Add createBay() call to the script
 */
export function addCreateBayCall(filePath: string, analysis: SvelteFileAnalysis): void {
	const content = readFileSync(filePath, 'utf-8');

	const before = content.slice(0, analysis.scriptContentStart);
	const scriptContent = content.slice(analysis.scriptContentStart, analysis.scriptContentEnd);
	const after = content.slice(analysis.scriptContentEnd);

	// Add the call at the end of the script content
	const newScriptContent = scriptContent + '\n\n\tcreateBay();\n';

	writeFileSync(filePath, before + newScriptContent + after, 'utf-8');
}
