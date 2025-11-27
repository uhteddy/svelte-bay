<script lang="ts">
	import { Portal, Pod } from '../../../lib/index.js';
	
	let showPod = $state(false);
</script>

<div class="p-4 space-y-4">
	<h1 class="text-2xl font-bold">Conditional Pods Test</h1>
	
	<div class="flex items-center gap-2">
		<input type="checkbox" id="toggle" bind:checked={showPod} class="w-4 h-4" />
		<label for="toggle">Show Pod Content</label>
	</div>

	<div class="border p-4 rounded bg-gray-50 mt-4">
		<h2 class="font-semibold mb-2">Target Portal ("conditional-zone")</h2>
		<Portal name="conditional-zone" />
	</div>

	{#if showPod}
		<Pod to="conditional-zone">
			<div class="bg-green-100 p-2 rounded text-green-800 animate-in fade-in zoom-in duration-300">
				I am conditionally rendered!
			</div>
		</Pod>
	{/if}
</div>
