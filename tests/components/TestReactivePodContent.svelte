<script lang="ts">
  import { createBay } from "../../src/lib/index.ts";
  import Portal from "../../src/lib/Portal.svelte";
  import Pod from "../../src/lib/Pod.svelte";

  let {
    portalName,
    initialContent,
  }: { portalName: string; initialContent: string } = $props();

  let content = $state(initialContent);

  // Create the bay context for testing
  createBay();

  function updateContent(newContent: string) {
    content = newContent;
  }
</script>

<button
  data-testid="update-button"
  onclick={() => updateContent("Updated Content")}
>
  Update Content
</button>

<div data-testid="portal">
  <Portal name={portalName} />
</div>

<Pod to={portalName}>
  {content}
</Pod>
