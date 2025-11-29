<script lang="ts">
  import { createBay } from "../../src/lib/index.ts";
  import Portal from "../../src/lib/Portal.svelte";
  import Pod from "../../src/lib/Pod.svelte";

  let {
    portalName,
    content,
    showPod = true,
  }: { portalName: string; content: string; showPod?: boolean } = $props();

  // Create the bay context for testing
  createBay();
</script>

<div data-testid="portal">
  <Portal name={portalName} />
</div>

{#if showPod}
  <Pod to={portalName}>
    {content}
  </Pod>
{/if}
