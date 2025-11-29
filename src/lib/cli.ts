#!/usr/bin/env node

import { Command } from 'commander';
import { initCommand } from './cli/init-command.js';
import { readFileSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

// Get package.json version
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const packageJson = JSON.parse(readFileSync(join(__dirname, '../package.json'), 'utf-8'));

const program = new Command();

program
	.name('svelte-bay')
	.description('CLI tool for svelte-bay - the simplest portal system for Svelte 5')
	.version(packageJson.version);

program
	.command('init')
	.description('Initialize svelte-bay in your SvelteKit project')
	.action(async () => {
		try {
			await initCommand();
		} catch (error) {
			console.error('An error occurred:', error);
			process.exit(1);
		}
	});

program.parse();
