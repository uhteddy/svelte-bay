<script lang="ts">
	import { getBayState } from './portal-state.svelte.js';

	let { name }: { name: string } = $props();

	const portalState = getBayState();
</script>

{#if portalState.content[name]}
	{#each portalState.content[name] as snippet}
		{@render snippet()}
	{/each}
{/if}
