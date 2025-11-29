<script lang="ts">
  import { createBay } from "../../src/lib/index.ts";
  import Portal from "../../src/lib/Portal.svelte";
  import Pod from "../../src/lib/Pod.svelte";

  let { initialPortal, content }: { initialPortal: string; content: string } =
    $props();

  let targetPortal = $state(initialPortal);

  // Create the bay context for testing
  createBay();
</script>

<div data-testid="portal-a">
  <Portal name="portal-a" />
</div>

<div data-testid="portal-b">
  <Portal name="portal-b" />
</div>

<Pod to={targetPortal}>
  {content}
</Pod>
