import { existsSync, readFileSync, writeFileSync } from 'fs';
import { join, resolve } from 'path';

export interface SvelteFileAnalysis {
	hasScriptTag: boolean; // True if an instance script (non-module) exists
	hasModuleScriptTag: boolean; // True if a module script exists
	scriptTagStart: number; // Position in file where instance script tag starts
	scriptTagEnd: number; // Position in file where instance script tag ends
	scriptContentStart: number; // Position where instance script content starts (after <script> or <script lang="ts">)
	scriptContentEnd: number; // Position where instance script content ends (before </script>)
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
 * Check if a script tag is a module script (has context="module")
 */
function isModuleScript(scriptTag: string): boolean {
	return /context\s*=\s*["']module["']/.test(scriptTag);
}

/**
 * Analyze a Svelte file to determine its structure and imports
 * This function specifically looks for instance scripts (non-module) since
 * createBay uses setContext which only works in instance scripts.
 */
export function analyzeSvelteFile(filePath: string): SvelteFileAnalysis {
	const content = readFileSync(filePath, 'utf-8');

	const analysis: SvelteFileAnalysis = {
		hasScriptTag: false,
		hasModuleScriptTag: false,
		scriptTagStart: -1,
		scriptTagEnd: -1,
		scriptContentStart: -1,
		scriptContentEnd: -1,
		hasCreateBayImport: false,
		hasSvelteBayImport: false,
		hasCreateBayCall: false
	};

	// Find all script tags (including possible lang attribute)
	const scriptTagRegex = /<script(\s+[^>]*)?>/gi;
	let match;
	
	while ((match = scriptTagRegex.exec(content)) !== null) {
		const scriptTag = match[0];
		const tagStart = match.index;
		const contentStart = tagStart + scriptTag.length;
		
		// Find the corresponding closing tag
		const closeScriptRegex = /<\/script>/i;
		const remainingContent = content.slice(contentStart);
		const closeMatch = remainingContent.match(closeScriptRegex);
		
		if (!closeMatch) continue;
		
		const contentEnd = contentStart + closeMatch.index!;
		const tagEnd = contentEnd + closeMatch[0].length;
		
		if (isModuleScript(scriptTag)) {
			// This is a module script - just note its existence
			analysis.hasModuleScriptTag = true;
		} else {
			// This is an instance script - this is what we want
			analysis.hasScriptTag = true;
			analysis.scriptTagStart = tagStart;
			analysis.scriptContentStart = contentStart;
			analysis.scriptContentEnd = contentEnd;
			analysis.scriptTagEnd = tagEnd;

			// Extract script content
			const scriptContent = content.slice(contentStart, contentEnd);

			// Check for svelte-bay imports
			const importRegex = /import\s+{([^}]+)}\s+from\s+['"]svelte-bay['"]/;
			const importMatch = scriptContent.match(importRegex);

			if (importMatch) {
				analysis.hasSvelteBayImport = true;
				analysis.svelteBayImportLine = importMatch[0];
				analysis.svelteBayImportStart = contentStart + importMatch.index!;
				analysis.svelteBayImportEnd = analysis.svelteBayImportStart + importMatch[0].length;

				// Check if createBay is in the import
				const imports = importMatch[1].split(',').map((s) => s.trim());
				analysis.hasCreateBayImport = imports.includes('createBay');
			}

			// Check for createBay() call
			analysis.hasCreateBayCall = /createBay\s*\(\s*\)/.test(scriptContent);
			
			// Once we find an instance script, we're done
			break;
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
 * This handles files that might have a module script - in that case,
 * the instance script is inserted after the module script.
 */
export function addScriptTagWithBay(filePath: string): void {
	const content = readFileSync(filePath, 'utf-8');

	const instanceScript = `<script>
	import { createBay } from 'svelte-bay';

	createBay();
</script>

`;

	// Check if there's a module script we need to insert after
	const moduleScriptRegex = /<script\s+[^>]*context\s*=\s*["']module["'][^>]*>[\s\S]*?<\/script>/i;
	const moduleScriptMatch = content.match(moduleScriptRegex);
	
	let newContent: string;
	if (moduleScriptMatch) {
		// Insert instance script after the module script
		const insertPos = moduleScriptMatch.index! + moduleScriptMatch[0].length;
		newContent = content.slice(0, insertPos) + '\n\n' + instanceScript + content.slice(insertPos).trimStart();
	} else {
		// No module script, prepend to file
		newContent = instanceScript + content;
	}

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
			const imports = existingImports.split(',').map(s => s.trim()).filter(s => s !== 'createBay');
			const newImportStatement = `import { createBay${imports.length ? ', ' + imports.join(', ') : ''} } from 'svelte-bay'`;

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

/**
 * Package manager types
 */
export type PackageManager = 'npm' | 'bun' | 'pnpm' | 'yarn';

/**
 * Detect which package manager is being used in the project
 */
export function detectPackageManager(projectRoot: string): PackageManager | null {
	// Check for lock files to determine package manager
	if (existsSync(join(projectRoot, 'bun.lockb')) || existsSync(join(projectRoot, 'bun.lock'))) {
		return 'bun';
	}
	if (existsSync(join(projectRoot, 'pnpm-lock.yaml'))) {
		return 'pnpm';
	}
	if (existsSync(join(projectRoot, 'yarn.lock'))) {
		return 'yarn';
	}
	if (existsSync(join(projectRoot, 'package-lock.json'))) {
		return 'npm';
	}

	// Default to npm if no lock file found
	return null;
}

/**
 * Check if svelte-bay is already installed in package.json
 */
export function isSvelteBayInstalled(projectRoot: string): boolean {
	const packageJsonPath = join(projectRoot, 'package.json');
	
	if (!existsSync(packageJsonPath)) {
		return false;
	}

	try {
		const packageJson = JSON.parse(readFileSync(packageJsonPath, 'utf-8'));
		const dependencies = packageJson.dependencies || {};
		const devDependencies = packageJson.devDependencies || {};

		return 'svelte-bay' in dependencies || 'svelte-bay' in devDependencies;
	} catch (error) {
		return false;
	}
}

/**
 * Get the install command for a package manager
 */
export function getInstallCommand(packageManager: PackageManager): string {
	const commands: Record<PackageManager, string> = {
		npm: 'npm install svelte-bay',
		bun: 'bun add svelte-bay',
		pnpm: 'pnpm add svelte-bay',
		yarn: 'yarn add svelte-bay'
	};

	return commands[packageManager];
}

/**
 * Find vite.config file (js or ts)
 */
export function findViteConfig(projectRoot: string): string | null {
	const possiblePaths = [
		join(projectRoot, 'vite.config.ts'),
		join(projectRoot, 'vite.config.js')
	];

	for (const path of possiblePaths) {
		if (existsSync(path)) {
			return path;
		}
	}

	return null;
}

/**
 * Check if svelteBay vite plugin is already configured
 */
export function isVitePluginConfigured(viteConfigPath: string): boolean {
	try {
		const content = readFileSync(viteConfigPath, 'utf-8');
		
		// Check for import
		const hasImport = /import\s+{[^}]*svelteBay[^}]*}\s+from\s+['"]svelte-bay\/vite['"]/.test(content) ||
			/import\s+{[^}]*svelteBay[^}]*}\s+from\s+["']svelte-bay\/vite["']/.test(content);
		
		// Check for plugin usage
		const hasPlugin = /svelteBay\s*\(\s*\)/.test(content);
		
		return hasImport && hasPlugin;
	} catch (error) {
		return false;
	}
}

/**
 * Add svelteBay plugin to vite.config
 */
export function addVitePlugin(viteConfigPath: string): void {
	const content = readFileSync(viteConfigPath, 'utf-8');
	
	// Check if svelte-bay/vite import already exists
	const hasImport = /import.*from\s+['"]svelte-bay\/vite['"]/.test(content);
	
	let newContent = content;
	
	if (!hasImport) {
		// Add import after existing imports
		// Find the last import statement
		const importMatches = Array.from(content.matchAll(/^import\s+.+from\s+.+;$/gm));
		
		if (importMatches.length > 0) {
			const lastImport = importMatches[importMatches.length - 1];
			const insertPos = lastImport.index! + lastImport[0].length;
			
			const importStatement = "\nimport { svelteBay } from 'svelte-bay/vite';";
			newContent = content.slice(0, insertPos) + importStatement + content.slice(insertPos);
		} else {
			// No imports found, add at the top
			newContent = "import { svelteBay } from 'svelte-bay/vite';\n" + content;
		}
	}
	
	// Add plugin to the plugins array
	// Find the plugins array
	const pluginsMatch = newContent.match(/plugins:\s*\[([\s\S]*?)\]/);
	
	if (pluginsMatch) {
		const pluginsContent = pluginsMatch[1];
		const pluginsStart = pluginsMatch.index! + pluginsMatch[0].indexOf('[') + 1;
		
		// Check if there are already plugins
		const trimmedPlugins = pluginsContent.trim();
		let pluginToAdd = 'svelteBay()';
		
		if (trimmedPlugins) {
			// Add after existing plugins with proper formatting
			const lastPlugin = trimmedPlugins.lastIndexOf(')');
			if (lastPlugin !== -1) {
				// Add comma and new plugin
				pluginToAdd = ', ' + pluginToAdd;
			}
		}
		
		// Insert the plugin
		const before = newContent.slice(0, pluginsStart);
		const pluginsArray = newContent.slice(pluginsStart, pluginsMatch.index! + pluginsMatch[0].length - 1);
		const after = newContent.slice(pluginsMatch.index! + pluginsMatch[0].length - 1);
		
		newContent = before + pluginsArray + pluginToAdd + after;
	}
	
	writeFileSync(viteConfigPath, newContent, 'utf-8');
}

