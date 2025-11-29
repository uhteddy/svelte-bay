<script lang="ts">
  import { createBay, getBayState } from "../../src/lib/index.ts";
  import Portal from "../../src/lib/Portal.svelte";
  import Pod from "../../src/lib/Pod.svelte";
  import { untrack } from "svelte";

  let {
    portalName,
    content,
  }: {
    portalName: string;
    content: string;
  } = $props();

  let targetPortal = $state(portalName);
  let podContent = $state(content);

  createBay();
  const bayState = getBayState();

  // Track state changes to the Portal content array
  // This should only change when Pods are added/removed
  // Uses targetPortal to properly track the portal that the Pod is actually registered to
  let contentArrayChangeCount = $state(0);
  $effect(() => {
    const _ = bayState.content[targetPortal];
    untrack(() => {
      contentArrayChangeCount++;
    });
  });

  function updateTarget(newTarget: string) {
    targetPortal = newTarget;
  }

  function updateContent(newContent: string) {
    podContent = newContent;
  }
</script>

<div data-testid="portal">
  <Portal name={portalName} />
</div>

<Pod to={targetPortal}>
  {podContent}
</Pod>

<button data-testid="update-target" onclick={() => updateTarget("new-portal")}>
  Update Target
</button>

<button
  data-testid="update-content"
  onclick={() => updateContent("New Content")}
>
  Update Content
</button>

<div data-testid="content-array-changes">{contentArrayChangeCount}</div>
