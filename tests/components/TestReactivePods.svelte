<script lang="ts">
  import { createBay } from "../../src/lib/index.ts";
  import Portal from "../../src/lib/Portal.svelte";
  import Pod from "../../src/lib/Pod.svelte";

  let {
    portalName,
    initialPodCount,
  }: { portalName: string; initialPodCount: number } = $props();

  let podCount = $state(initialPodCount);

  // Create the bay context for testing
  createBay();
</script>

<div data-testid="portal">
  <Portal name={portalName} />
</div>

{#each Array(podCount) as _, i}
  <Pod to={portalName}>
    Pod {i}
  </Pod>
{/each}
