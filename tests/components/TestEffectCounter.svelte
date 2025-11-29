<script lang="ts">
  import { createBay } from "../../src/lib/index.ts";
  import Portal from "../../src/lib/Portal.svelte";
  import Pod from "../../src/lib/Pod.svelte";
  import { untrack } from "svelte";

  let {
    portalName,
    content,
    onEffectRun,
  }: {
    portalName: string;
    content: string;
    onEffectRun?: () => void;
  } = $props();

  let effectRunCount = $state(0);

  // Create the bay context for testing
  createBay();

  // Track effect runs
  $effect(() => {
    untrack(() => {
      effectRunCount++;
      onEffectRun?.();
    });
  });

</script>

<div data-testid="portal">
  <Portal name={portalName} />
</div>

<Pod to={portalName}>
  {content}
</Pod>

<div data-testid="effect-count">{effectRunCount}</div>
