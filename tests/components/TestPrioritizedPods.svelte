<script lang="ts">
  import { createBay } from "../../src/lib/index.ts";
  import Portal from "../../src/lib/Portal.svelte";
  import Pod from "../../src/lib/Pod.svelte";

  let {
    portalName,
    pods,
  }: {
    portalName: string;
    pods: { content: string; priority?: number }[];
  } = $props();

  // Create the bay context for testing
  createBay();
</script>

<div data-testid="portal">
  <Portal name={portalName} />
</div>

{#each pods as pod}
  <Pod to={portalName} priority={pod.priority}>
    {pod.content}
  </Pod>
{/each}
