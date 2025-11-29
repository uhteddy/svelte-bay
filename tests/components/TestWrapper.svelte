<script lang="ts">
  import { createBay } from "../../src/lib/index.ts";
  import Portal from "../../src/lib/Portal.svelte";
  import type { Snippet } from "svelte";

  let { portalName, children }: { portalName: string; children?: Snippet } =
    $props();

  // Create the bay context for testing
  createBay();
</script>

<div data-testid="portal">
  <Portal name={portalName} />
</div>

{#if children}
  {@render children()}
{/if}
