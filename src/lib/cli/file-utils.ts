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

	while (true) {
		if (
			existsSync(join(currentDir, 'svelte.config.js')) ||
			existsSync(join(currentDir, 'svelte.config.ts'))
		) {
			return currentDir;
		}
		const parentDir = resolve(currentDir, '..');
		if (parentDir === currentDir) {
			// Reached filesystem root
			break;
		}
		currentDir = parentDir;
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

import { parse } from 'svelte/compiler';
import MagicString from 'magic-string';

// ... existing imports ...

/**
 * Analyze a Svelte file to determine its structure and imports
 * Uses svelte/compiler to parse the file into an AST
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

	try {
		// Parse the Svelte file
		// @ts-ignore - svelte/compiler types might not be fully picked up in this context
		const ast = parse(content, { modern: true });

		// Check for instance script
		if (ast.instance) {
			analysis.hasScriptTag = true;
			analysis.scriptTagStart = ast.instance.start;
			analysis.scriptTagEnd = ast.instance.end;
			
			// content is the Program node inside the script
			if (ast.instance.content) {
				// @ts-ignore
				analysis.scriptContentStart = ast.instance.content.start;
				// @ts-ignore
				analysis.scriptContentEnd = ast.instance.content.end;

				// Traverse the AST to find imports and calls
				for (const node of ast.instance.content.body) {
					// Check for imports
					if (node.type === 'ImportDeclaration' && node.source.value === 'svelte-bay') {
						analysis.hasSvelteBayImport = true;
						// @ts-ignore
						analysis.svelteBayImportStart = node.start;
						// @ts-ignore
						analysis.svelteBayImportEnd = node.end;
						// @ts-ignore
						analysis.svelteBayImportLine = content.slice(node.start, node.end);

						// Check specifiers for createBay
						// @ts-ignore
						for (const specifier of node.specifiers) {
							// @ts-ignore
							if (specifier.imported && specifier.imported.name === 'createBay') {
								analysis.hasCreateBayImport = true;
							}
						}
					}

					// Check for createBay() call
					if (node.type === 'ExpressionStatement' && 
						node.expression.type === 'CallExpression' && 
						// @ts-ignore
						node.expression.callee.name === 'createBay') {
						analysis.hasCreateBayCall = true;
					}
				}
			}
		}

		// Check for module script
		if (ast.module) {
			analysis.hasModuleScriptTag = true;
		}

	} catch (error) {
		// Fallback or error handling if parsing fails (e.g. syntax error in user file)
		console.warn(`Warning: Failed to parse ${filePath} with svelte/compiler. Falling back to basic checks.`);
		// We could implement a regex fallback here if needed, but for now we'll assume valid svelte files
	}

	return analysis;
}

/**
 * Create a new +layout.svelte file with createBay setup
 */
export function createLayoutWithBay(filePath: string): void {
	const content = `<script>
	import { createBay } from 'svelte-bay';
	let { children } = $props();

	createBay();
</script>

{@render children()}
`;

	writeFileSync(filePath, content, 'utf-8');
}

/**
 * Add script tag with createBay to existing layout
 */
export function addScriptTagWithBay(filePath: string): void {
	const content = readFileSync(filePath, 'utf-8');
	const s = new MagicString(content);

	const instanceScript = `<script>
	import { createBay } from 'svelte-bay';

	createBay();
</script>

`;

	try {
		// @ts-ignore
		const ast = parse(content, { modern: true });

		if (ast.module) {
			// Insert after module script
			s.appendRight(ast.module.end, '\n\n' + instanceScript);
		} else {
			// Prepend to file
			s.prepend(instanceScript);
		}
	} catch (e) {
		// Fallback if parsing fails
		s.prepend(instanceScript);
	}

	writeFileSync(filePath, s.toString(), 'utf-8');
}

/**
 * Add createBay import to existing script tag
 */
export function addCreateBayImport(filePath: string, analysis: SvelteFileAnalysis): void {
	const content = readFileSync(filePath, 'utf-8');
	const s = new MagicString(content);

	if (
		analysis.hasSvelteBayImport &&
		analysis.svelteBayImportStart !== undefined &&
		analysis.svelteBayImportEnd !== undefined
	) {
		// Add createBay to existing svelte-bay import
		// We can use the AST info to be precise, but string manipulation on the import line is safe enough
		// given we know the exact start/end of the import statement
		const importStatement = content.slice(analysis.svelteBayImportStart, analysis.svelteBayImportEnd);
		
		// Simple regex on the extracted import statement is safe
		const importMatch = importStatement.match(/import\s+{([^}]+)}\s+from\s+['"]svelte-bay['"]/);
		if (importMatch) {
			const existingImports = importMatch[1].trim();
			// Reconstruct import
			const newImportStatement = `import { createBay, ${existingImports} } from 'svelte-bay'`;
			s.overwrite(analysis.svelteBayImportStart, analysis.svelteBayImportEnd, newImportStatement);
		}
	} else {
		// Add new import at the beginning of the script content
		if (analysis.scriptContentStart !== -1) {
			s.appendRight(analysis.scriptContentStart, `\n\timport { createBay } from 'svelte-bay';`);
		}
	}

	writeFileSync(filePath, s.toString(), 'utf-8');
}

/**
 * Add createBay() call to the script
 */
export function addCreateBayCall(filePath: string, analysis: SvelteFileAnalysis): void {
	const content = readFileSync(filePath, 'utf-8');
	const s = new MagicString(content);

	if (analysis.scriptContentEnd !== -1) {
		// Insert before the closing brace/end of script content
		// We append to the end of the content
		s.appendLeft(analysis.scriptContentEnd, '\n\n\tcreateBay();\n');
	}

	writeFileSync(filePath, s.toString(), 'utf-8');
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

