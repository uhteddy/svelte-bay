<script lang="ts">
  import { createBay } from "../../src/lib/index.ts";
  import Portal from "../../src/lib/Portal.svelte";
  import Pod from "../../src/lib/Pod.svelte";

  let {
    portalName,
    initialPriority,
  }: { portalName: string; initialPriority: number | undefined } = $props();

  let priority = $state(initialPriority);

  // Create the bay context for testing
  createBay();
</script>

<button data-testid="set-priority-1" onclick={() => (priority = 1)}>
  Set Priority 1
</button>
<button data-testid="clear-priority" onclick={() => (priority = undefined)}>
  Clear Priority
</button>

<div data-testid="portal">
  <Portal name={portalName} />
</div>

<Pod to={portalName} {priority}>Movable</Pod>
<Pod to={portalName} priority={2}>Fixed A</Pod>
<Pod to={portalName} priority={3}>Fixed B</Pod>
