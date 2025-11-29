<script lang="ts">
  import { createBay, getBayState } from "../../src/lib/index.ts";
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
  const bayState = getBayState();

  // Track effect runs when Portal-Pod state changes
  // This effect observes the portal content array to test actual Portal-Pod behavior
  $effect(() => {
    // Track the portal content array - this is the reactive state we want to observe
    const _ = bayState.content[portalName];
    untrack(() => {
      effectRunCount++;
      onEffectRun?.();
    });
  });

  function getEffectCount() {
    return effectRunCount;
  }
</script>

<div data-testid="portal">
  <Portal name={portalName} />
</div>

<Pod to={portalName}>
  {content}
</Pod>

<div data-testid="effect-count">{effectRunCount}</div>
