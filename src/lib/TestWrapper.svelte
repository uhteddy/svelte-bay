<script lang="ts">
	import { createBay, Portal, Pod } from './index.js';
	
	let { testCase }: { testCase: string } = $props();

	createBay();
	
	let showToggle = $state(true);
</script>

{#if testCase === 'basic'}
	<Portal name="test" />
	<Pod to="test">
		<p>Hello from Pod</p>
	</Pod>
{/if}

{#if testCase === 'multiple'}
	<Portal name="multi" />
	<Pod to="multi">
		<p>Pod 1</p>
	</Pod>
	<Pod to="multi">
		<p>Pod 2</p>
	</Pod>
{/if}

{#if testCase === 'toggle'}
	<button onclick={() => showToggle = !showToggle}>Toggle</button>
	<Portal name="toggle" />
	{#if showToggle}
		<Pod to="toggle">
			<p>Toggle Content</p>
		</Pod>
	{/if}
{/if}
