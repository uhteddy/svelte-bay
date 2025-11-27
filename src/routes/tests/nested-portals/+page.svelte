<script lang="ts">
	import { Portal, Pod } from '../../../lib/index.js';
</script>

<div class="p-4 space-y-4">
	<h1 class="text-2xl font-bold">Nested Portals Test</h1>
	<p>A Pod containing another Portal.</p>

	<div class="border p-4 rounded bg-gray-50">
		<h2 class="font-semibold mb-2">Outer Portal ("outer-zone")</h2>
		<Portal name="outer-zone" />
	</div>

	<Pod to="outer-zone">
		<div class="bg-purple-100 p-4 rounded border border-purple-200">
			<p class="mb-2 font-medium text-purple-900">I am content in the Outer Zone.</p>
			
			<div class="bg-white p-2 rounded border border-gray-200">
				<h3 class="text-sm font-semibold mb-1">Inner Portal ("inner-zone")</h3>
				<Portal name="inner-zone" />
			</div>
		</div>
	</Pod>

	<Pod to="inner-zone">
		<span class="text-xs bg-yellow-100 text-yellow-800 px-2 py-1 rounded-full">
			Deeply nested content!
		</span>
	</Pod>
</div>
