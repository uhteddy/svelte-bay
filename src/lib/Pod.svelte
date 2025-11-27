<script lang="ts">
	import { getBayState } from './portal-state.svelte.js';
	import { type Snippet, untrack } from 'svelte';
	import type { PortalName } from './types.js';

	let { to, children }: { to: PortalName; children: Snippet } = $props();

	const portalState = getBayState();

	$effect(() => {
		const target = to;
		const snippet = children;

		untrack(() => {
			if (!portalState.content[target]) {
				portalState.content[target] = [];
			}
			portalState.content[target].push(snippet);
		});

		return () => {
			const list = portalState.content[target];
			if (list) {
				const index = list.indexOf(snippet);
				if (index !== -1) {
					list.splice(index, 1);
				}
			}
		};
	});
</script>
