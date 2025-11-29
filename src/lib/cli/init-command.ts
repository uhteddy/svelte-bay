import prompts from 'prompts';
import chalk from 'chalk';
import { dirname, join } from 'path';
import { mkdirSync } from 'fs';
import {
	findSvelteKitRoot,
	findRootLayout,
	analyzeSvelteFile,
	createLayoutWithBay,
	addScriptTagWithBay,
	addCreateBayImport,
	addCreateBayCall
} from './file-utils.js';

export async function initCommand(): Promise<void> {
	console.log(chalk.blue.bold('\n🌊 Svelte Bay Initialization\n'));

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

	console.log(chalk.green(`✓ Found SvelteKit project at: ${chalk.cyan(projectRoot)}`));

	// Step 2: Find or create +layout.svelte
	let layoutPath = findRootLayout(projectRoot);

	if (!layoutPath) {
		console.log(chalk.yellow('\n⚠ No +layout.svelte file found in src/routes/'));

		const response = await prompts({
			type: 'confirm',
			name: 'createLayout',
			message: 'Would you like to create one?',
			initial: true
		});

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
			console.log(chalk.green(`\n✓ Created ${chalk.cyan('+layout.svelte')} with svelte-bay setup`));
			console.log(chalk.green('✓ Initialization complete!'));
			printNextSteps();
			return;
		} catch (error) {
			console.log(chalk.red(`\n❌ Error creating layout file: ${error}`));
			process.exit(1);
		}
	}

	console.log(chalk.green(`✓ Found +layout.svelte at: ${chalk.cyan(layoutPath)}`));

	// Step 3: Analyze the file
	const analysis = analyzeSvelteFile(layoutPath);

	// Step 4: Handle no script tag
	if (!analysis.hasScriptTag) {
		console.log(chalk.yellow('\n⚠ No <script> tag found in +layout.svelte'));

		const response = await prompts({
			type: 'confirm',
			name: 'addScript',
			message: 'Would you like to add one with svelte-bay setup?',
			initial: true
		});

		if (!response.addScript) {
			console.log(chalk.gray('\nSetup cancelled. You can manually add the script tag later.'));
			process.exit(0);
		}

		addScriptTagWithBay(layoutPath);
		console.log(chalk.green('\n✓ Added <script> tag with svelte-bay setup'));
		console.log(chalk.green('✓ Initialization complete!'));
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

	console.log(chalk.green.bold('\n✓ Initialization complete!'));
	printNextSteps();
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
