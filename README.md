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

## ⚡️ Quick Start with CLI

The easiest way to get started is using our CLI tool:

```bash
# Install the package
npm install svelte-bay

# Run the init command in your SvelteKit project
npx svelte-bay init
```

The CLI will:

- ✅ Find your root `+layout.svelte` (or create it if missing)
- ✅ Add the `createBay()` import and call
- ✅ Handle all edge cases intelligently

## 🛠️ Usage

### 1. Initialize the Bay System

> **💡 Tip**: You can skip this step by running `npx svelte-bay init`

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

## 🛡️ Type Safety (Optional)

By default, `svelte-bay` works with any string for portal names. If you want **full type safety and autocomplete**, you can use our Vite plugin.

### Automatic Type Generation ⚡️

1. Add the plugin to your `vite.config.ts`:

```ts
import { sveltekit } from "@sveltejs/kit/vite";
import { defineConfig } from "vite";
import { svelteBay } from "svelte-bay/vite";

export default defineConfig({
  plugins: [sveltekit(), svelteBay()],
});
```

2. Run your dev server (`npm run dev`).
3. A `src/svelte-bay.d.ts` file will be generated automatically.
4. Now `<Pod to="...">` and `<Portal name="...">` will autocomplete with your portal names!

### Manual Registry 🛠️

If you prefer not to use the plugin, you can manually define your portal names in your `src/app.d.ts`:

```ts
// src/app.d.ts
import "svelte-bay";

declare module "svelte-bay" {
  interface PortalRegistry {
    header: boolean;
    sidebar: boolean;
  }
}
```

## 📄 License

MIT
