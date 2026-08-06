<script lang="ts">
	import { getBayState } from './portal-state.svelte.js';
	import type { PortalName } from './types.js';

	let { name }: { name: PortalName } = $props();

	const portalState = getBayState();

	const pods = $derived(
		portalState.content[name]
			? [...portalState.content[name]].sort(
					(a, b) => (a.priority ?? Infinity) - (b.priority ?? Infinity)
				)
			: []
	);
</script>

{#each pods as pod (pod.snippet)}
	{@render pod.snippet()}
{/each}
