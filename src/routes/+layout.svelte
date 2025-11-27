<script lang="ts">
	import { createBay, Portal } from '../lib/index.js';
    const { children } = $props();
	createBay();
</script>

<div style="position: fixed; top: 0; left: 0; right: 0;">
    <Portal name="header" />
</div>
{@render children()}