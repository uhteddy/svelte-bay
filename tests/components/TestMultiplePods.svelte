<script lang="ts">
  import { createBay } from "../../src/lib/index.ts";
  import Portal from "../../src/lib/Portal.svelte";
  import Pod from "../../src/lib/Pod.svelte";

  let {
    portalName,
    podContents,
  }: { portalName: string; podContents: string[] } = $props();

  // Create the bay context for testing
  createBay();
</script>

<div data-testid="portal">
  <Portal name={portalName} />
</div>

{#each podContents as content}
  <Pod to={portalName}>
    {content}
  </Pod>
{/each}
