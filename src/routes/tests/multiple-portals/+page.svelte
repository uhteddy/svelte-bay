<script lang="ts">
	import { Portal, Pod } from '../../../lib/index.js';
</script>

<div class="p-4 space-y-4">
	<h1 class="text-2xl font-bold">Multiple Portals Test</h1>
	<p>Two portals with the name "shared-portal". Both should receive the content from the Pod.</p>

	<div class="grid grid-cols-2 gap-4">
		<div class="border p-4 rounded bg-gray-50">
			<h2 class="font-semibold mb-2">Portal 1</h2>
			<Portal name="shared-portal" />
		</div>

		<div class="border p-4 rounded bg-gray-50">
			<h2 class="font-semibold mb-2">Portal 2</h2>
			<Portal name="shared-portal" />
		</div>
	</div>

	<div class="mt-8 border-t pt-4">
		<h2 class="font-semibold mb-2">Pod Source</h2>
		<Pod to="shared-portal">
			<div class="bg-blue-100 p-2 rounded text-blue-800">
				I am a Pod content targeting "shared-portal"
			</div>
		</Pod>
	</div>
</div>
