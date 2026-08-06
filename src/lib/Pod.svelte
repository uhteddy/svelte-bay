<script lang="ts">
	import { getBayState } from './portal-state.svelte.js';
	import { type Snippet, untrack } from 'svelte';
	import type { PortalName } from './types.js';

	let { to, priority, children }: { to: PortalName; priority?: number; children: Snippet } =
		$props();

	const portalState = getBayState();

	$effect(() => {
		const target = to;
		const snippet = children;
		const podPriority = priority;

		untrack(() => {
			if (!portalState.content[target]) {
				portalState.content[target] = [];
			}
			portalState.content[target].push({ snippet, priority: podPriority });
		});

		return () => {
			const list = portalState.content[target];
			if (list) {
				const index = list.findIndex((entry) => entry.snippet === snippet);
				if (index !== -1) {
					list.splice(index, 1);
				}
			}
		};
	});
</script>
