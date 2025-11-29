<script lang="ts">
  import { createBay } from "../../src/lib/index.ts";
  import Portal from "../../src/lib/Portal.svelte";
  import Pod from "../../src/lib/Pod.svelte";

  let { portalName, content }: { portalName: string; content: string } =
    $props();

  let showPortal = $state(true);

  // Create the bay context for testing
  createBay();

  function togglePortal() {
    showPortal = !showPortal;
  }
</script>

<button data-testid="toggle-button" onclick={togglePortal}>
  Toggle Portal
</button>

{#if showPortal}
  <div data-testid="portal">
    <Portal name={portalName} />
  </div>
{/if}

<Pod to={portalName}>
  {content}
</Pod>
