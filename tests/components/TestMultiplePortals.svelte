<script lang="ts">
  import { createBay } from "../../src/lib/index.ts";
  import Portal from "../../src/lib/Portal.svelte";
  import Pod from "../../src/lib/Pod.svelte";

  let {
    portal1Name,
    portal2Name,
    content1,
    content2,
  }: {
    portal1Name: string;
    portal2Name: string;
    content1: string;
    content2: string;
  } = $props();

  // Create the bay context for testing
  createBay();
</script>

<div data-testid="portal-1">
  <Portal name={portal1Name} />
</div>

<div data-testid="portal-2">
  <Portal name={portal2Name} />
</div>

<Pod to={portal1Name}>
  {content1}
</Pod>

<Pod to={portal2Name}>
  {content2}
</Pod>
