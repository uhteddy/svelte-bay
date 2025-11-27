# 🏝️ Svelte Bay

**The simplest, most developer-friendly portal system for Svelte 5.**

`svelte-bay` allows you to easily teleport content from anywhere in your app to specific "bays" (portals) in your layout using the power of Svelte 5 Runes and Context.

## ✨ Features

- **🚀 Zero Config**: Just initialize and go.
- **⚡️ Svelte 5 Ready**: Built with Runes (`$state`, `$effect`) for maximum performance.
- **🛡️ SSR Safe**: Uses `setContext` to ensure state is scoped to the current request tree.
- **📦 Multi-Pod Support**: Stack multiple pods into a single portal bay.

## 📦 Installation

```bash
npm install svelte-bay
# or
bun add svelte-bay
```

## 🛠️ Usage

### 1. Initialize the Bay System

In your root layout (usually `src/routes/+layout.svelte`), initialize the system. This sets up the context for your app.

```svelte
<script lang="ts">
  import { createBay } from 'svelte-bay';

  // Initialize the bay system once at the root
  createBay();

  let { children } = $props();
</script>

{@render children()}
```

### 2. Create a Portal (The Destination)

Place a `<Portal />` wherever you want content to appear. Give it a unique `name`.

```svelte
<script>
  import { Portal } from 'svelte-bay';
</script>

<header class="flex justify-between p-4">
  <h1>My App</h1>

  <!-- Content sent to 'header-actions' will appear here -->
  <div class="actions">
    <Portal name="header-actions" />
  </div>
</header>
```

### 3. Send Content via a Pod (The Source)

From _any_ component in your app, use a `<Pod />` to teleport content to a portal.

```svelte
<script>
  import { Pod } from 'svelte-bay';
</script>

<Pod to="header-actions">
  <button class="btn-primary">Save Changes</button>
</Pod>

<Pod to="header-actions">
  <button class="btn-secondary">Cancel</button>
</Pod>
```

## 💡 How it Works

1. **`createBay()`**: Creates a reactive `$state` registry and shares it via `setContext`.
2. **`<Pod />`**: Registers its `children` snippet to the registry key matching its `to` prop.
3. **`<Portal />`**: Listens to the registry and renders all snippets registered to its `name`.

## 📄 License

MIT
