<script lang="ts">
	import { getBayState } from './portal-state.svelte.js';
	import type { PortalName } from './types.js';

	let { name }: { name: PortalName } = $props();

	const portalState = getBayState();
</script>

{#if portalState.content[name]}
	{#each portalState.content[name] as snippet}
		{@render snippet()}
	{/each}
{/if}
