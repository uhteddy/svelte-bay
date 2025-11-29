import prompts from 'prompts';
import chalk from 'chalk';
import { dirname, join } from 'path';
import { mkdirSync } from 'fs';
import { spawn } from 'child_process';
import {
	findSvelteKitRoot,
	findRootLayout,
	analyzeSvelteFile,
	createLayoutWithBay,
	addScriptTagWithBay,
	addCreateBayImport,
	addCreateBayCall,
	detectPackageManager,
	isSvelteBayInstalled,
	getInstallCommand,
	findViteConfig,
	isVitePluginConfigured,
	addVitePlugin,
	type PackageManager
} from './file-utils.js';

export async function initCommand(): Promise<void> {
	console.log(chalk.blue.bold('\n🌊 Svelte Bay Initialization'));
	console.log(chalk.gray('━'.repeat(50)) + '\n');

	// Step 1: Check for Svelte project
	const projectRoot = findSvelteKitRoot();

	if (!projectRoot) {
		console.log(
			chalk.red(
				'❌ Error: No SvelteKit project found. Please run this command in a SvelteKit project directory.'
			)
		);
		console.log(
			chalk.gray('   (Looking for svelte.config.js or svelte.config.ts in parent directories)')
		);
		process.exit(1);
	}

	console.log(chalk.green(`✓ Found SvelteKit project`));
	console.log(chalk.gray(`  ${projectRoot}`));

	// Step 2: Check if svelte-bay is installed, install if not
	console.log('\n' + chalk.gray('─'.repeat(50)));
	console.log(chalk.blue.bold('📦 Package Installation'));
	console.log(chalk.gray('─'.repeat(50)) + '\n');

	const isInstalled = isSvelteBayInstalled(projectRoot);

	if (!isInstalled) {
		console.log(chalk.yellow('→ svelte-bay is not installed in this project'));

		// Detect package manager
		const detectedPM = detectPackageManager(projectRoot);
		const packageManagers: PackageManager[] = ['npm', 'bun', 'pnpm', 'yarn'];

		// Prompt user to select package manager
		const pmResponse = await prompts({
			type: 'select',
			name: 'packageManager',
			message: 'Which package manager would you like to use?',
			choices: packageManagers.map((pm) => ({
				title: pm === detectedPM ? `${pm} (detected)` : pm,
				value: pm
			})),
			initial: detectedPM ? packageManagers.indexOf(detectedPM) : 0
		});

		if (!pmResponse.packageManager) {
			console.log(chalk.gray('\nSetup cancelled.'));
			process.exit(0);
		}

		const selectedPM: PackageManager = pmResponse.packageManager;
		const installCmd = getInstallCommand(selectedPM);

		console.log(chalk.blue(`\n→ Installing svelte-bay with ${selectedPM}...`));
		console.log(chalk.gray(`   Running: ${installCmd}`));

		try {
			await runCommand(installCmd, projectRoot);
			console.log(chalk.green('\n✓ svelte-bay installed successfully'));
		} catch (error) {
			console.log(chalk.red(`\n❌ Error installing svelte-bay: ${error}`));
			console.log(chalk.gray(`\n   You can install it manually with: ${chalk.cyan(installCmd)}`));
			process.exit(1);
		}
	} else {
		console.log(chalk.green('✓ svelte-bay is already installed'));
	}

	// Step 3: Find or create +layout.svelte
	console.log('\n' + chalk.gray('─'.repeat(50)));
	console.log(chalk.blue.bold('📝 Layout Configuration'));
	console.log(chalk.gray('─'.repeat(50)) + '\n');

	let layoutPath = findRootLayout(projectRoot);

	if (!layoutPath) {
		console.log(chalk.yellow('\n⚠ No +layout.svelte file found in src/routes/'));

		const response = await prompts({
			type: 'confirm',
			name: 'createLayout',
			message: 'Would you like to create one?',
			initial: true
		}, {
			onCancel: () => {
				console.log(chalk.gray('\nSetup cancelled. You can run this command again later.'));
				process.exit(0);
			}
		}
	);

		if (!response.createLayout) {
			console.log(chalk.gray('\nSetup cancelled. You can run this command again later.'));
			process.exit(0);
		}

		// Create the layout file
		layoutPath = join(projectRoot, 'src', 'routes', '+layout.svelte');
		const layoutDir = dirname(layoutPath);

		try {
			mkdirSync(layoutDir, { recursive: true });
			createLayoutWithBay(layoutPath);
			console.log(chalk.green(`✓ Created ${chalk.cyan('+layout.svelte')} with svelte-bay setup`));
			printCompletion();
			printNextSteps();
			return;
		} catch (error) {
			console.log(chalk.red(`\n❌ Error creating layout file: ${error instanceof Error ? error.message : String(error)}`));
			process.exit(1);
		}
	}

	console.log(chalk.green(`✓ Found +layout.svelte`));
	console.log(chalk.gray(`  ${layoutPath}`));

	// Step 3: Analyze the file
	const analysis = analyzeSvelteFile(layoutPath);

	// Step 4: Handle no instance script tag
	if (!analysis.hasScriptTag) {
		const hasModule = analysis.hasModuleScriptTag;
		const message = hasModule 
			? '⚠ No instance <script> tag found in +layout.svelte (only a module script exists)'
			: '⚠ No <script> tag found in +layout.svelte';
		console.log(chalk.yellow(`\n${message}`));

		const response = await prompts({
			type: 'confirm',
			name: 'addScript',
			message: hasModule
				? 'Would you like to add an instance script with svelte-bay setup?'
				: 'Would you like to add one with svelte-bay setup?',
			initial: true
		});

		if (response.addScript === undefined) {
			console.log(chalk.gray('\nPrompt aborted. Exiting setup.'));
			process.exit(1);
		} else if (response.addScript === false) {
			console.log(chalk.gray('\nSetup cancelled. You can manually add the script tag later.'));
			process.exit(0);
		}

		addScriptTagWithBay(layoutPath);
		console.log(chalk.green('✓ Added <script> tag with svelte-bay setup'));
		printCompletion();
		printNextSteps();
		return;
	}

	// Step 5: Check if createBay is already fully set up
	if (analysis.hasCreateBayImport && analysis.hasCreateBayCall) {
		console.log(chalk.green('\n✓ svelte-bay is already set up in your +layout.svelte!'));
		console.log(
			chalk.gray('   createBay is imported and called. No changes needed.')
		);
		printNextSteps();
		return;
	}

	// Step 6: Add missing import
	if (!analysis.hasCreateBayImport) {
		if (analysis.hasSvelteBayImport) {
			console.log(
				chalk.yellow(
					'\n→ Found existing import from svelte-bay, adding createBay to the import list...'
				)
			);
		} else {
			console.log(chalk.yellow('\n→ Adding createBay import...'));
		}

		addCreateBayImport(layoutPath, analysis);
		console.log(chalk.green('✓ Added createBay import'));

		// Re-analyze after adding import
		const updatedAnalysis = analyzeSvelteFile(layoutPath);

		// Step 7: Add missing call
		if (!updatedAnalysis.hasCreateBayCall) {
			console.log(chalk.yellow('→ Adding createBay() call...'));
			addCreateBayCall(layoutPath, updatedAnalysis);
			console.log(chalk.green('✓ Added createBay() call'));
		}
	} else {
		// Has import but missing call
		console.log(chalk.yellow('\n→ createBay is imported but not called, adding the call...'));
		addCreateBayCall(layoutPath, analysis);
		console.log(chalk.green('✓ Added createBay() call'));
	}

	// Step 8: Prompt for Vite plugin setup (optional type safety)
	const viteConfigPath = findViteConfig(projectRoot);

	if (viteConfigPath) {
		const pluginConfigured = isVitePluginConfigured(viteConfigPath);

		if (!pluginConfigured) {
			console.log('\n' + chalk.gray('─'.repeat(50)));
			console.log(chalk.blue.bold('💡 Optional: Type Safety'));
			console.log(chalk.gray('─'.repeat(50)));
			console.log(chalk.gray('The Vite plugin provides autocomplete for Portal names in your IDE.'));
			console.log();

			const viteResponse = await prompts({
				type: 'confirm',
				name: 'addPlugin',
				message: 'Would you like to add the svelteBay Vite plugin for type safety?',
				initial: true
			});

			if (viteResponse.addPlugin) {
				try {
					addVitePlugin(viteConfigPath);
					console.log(chalk.green('\n✓ Added svelteBay plugin to vite.config'));
					console.log(chalk.gray('  Restart your dev server to enable Portal name autocomplete'));
				} catch (error) {
					console.log(chalk.yellow('\n⚠ Could not automatically add plugin. You can add it manually:'));
					console.log(chalk.gray(`  import { svelteBay } from 'svelte-bay/vite';`));
					console.log(chalk.gray(`  plugins: [sveltekit(), svelteBay()]`));
				}
			}
		} else {
			console.log('\n' + chalk.green('✓ Vite plugin is already configured'));
		}
	}

	printCompletion();
	printNextSteps();
}

/**
 * Helper function to run shell commands
 */
function runCommand(command: string, cwd: string): Promise<void> {
	return new Promise((resolve, reject) => {
		const parts = command.split(' ');
		const cmd = parts[0];
		const args = parts.slice(1);

		const child = spawn(cmd, args, {
			cwd,
			stdio: 'inherit',
			shell: true
		});

		child.on('error', (error) => {
			reject(error);
		});

		child.on('exit', (code) => {
			if (code === 0) {
				resolve();
			} else {
				reject(new Error(`Command exited with code ${code}`));
			}
		});
	});
}

function printCompletion(): void {
	console.log('\n' + chalk.gray('─'.repeat(50)));
	console.log(chalk.green.bold('✓ Initialization Complete!'));
	console.log(chalk.gray('─'.repeat(50)));
}

function printNextSteps(): void {
	console.log(chalk.blue.bold('\n📖 Next Steps:'));
	console.log(
		chalk.gray('   1. Import Portal and Pod components: ') +
			chalk.cyan("import { Portal, Pod } from 'svelte-bay';")
	);
	console.log(
		chalk.gray('   2. Use them in your app: ') +
			chalk.cyan('<Portal name="modal">...</Portal>')
	);
	console.log(
		chalk.gray('   3. Learn more: ') + chalk.cyan('https://github.com/uhteddy/svelte-bay')
	);
	console.log();
}
