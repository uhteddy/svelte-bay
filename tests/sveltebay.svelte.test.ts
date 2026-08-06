import { expect, test, describe } from 'vitest';
import { render } from 'vitest-browser-svelte';
import { createBay, getBayState } from '../src/lib/index.ts';
import TestWrapper from './components/TestWrapper.svelte';
import TestWithPortalAndPod from './components/TestWithPortalAndPod.svelte';
import TestMultiplePods from './components/TestMultiplePods.svelte';
import TestMultiplePortals from './components/TestMultiplePortals.svelte';
import TestToggleablePortal from './components/TestToggleablePortal.svelte';
import TestReactivePodContent from './components/TestReactivePodContent.svelte';
import TestPrioritizedPods from './components/TestPrioritizedPods.svelte';
import TestReactivePodPriority from './components/TestReactivePodPriority.svelte';

// Note: createBay and getBayState are Svelte context APIs that must be called
// within component context. Their functionality is thoroughly tested in the
// integration tests below where they're used within actual components.

// ====================
// Portal Component Tests
// ====================

describe('Portal Component', () => {
	test('renders nothing when no content is registered', async () => {
		const component = render(TestWrapper, {
			portalName: 'empty-portal'
		});

		// Portal should render but have no visible content
		const portal = document.querySelector('[data-testid="portal"]');
		expect(portal).toBeTruthy();
		expect(portal?.textContent?.trim()).toBe('');
	});

	test('renders content when Pod registers to it', async () => {
		const component = render(TestWithPortalAndPod, {
			portalName: 'test-portal',
			content: 'Hello from Pod'
		});

		await new Promise(resolve => setTimeout(resolve, 100));

		// Portal should render the Pod content
		const portal = document.querySelector('[data-testid="portal"]');
		expect(portal?.textContent).toContain('Hello from Pod');
	});

	test('renders multiple Pod snippets in order', async () => {
		const component = render(TestMultiplePods, {
			portalName: 'multi-portal',
			podContents: ['First Pod', 'Second Pod', 'Third Pod']
		});

		await new Promise(resolve => setTimeout(resolve, 100));

		const portal = document.querySelector('[data-testid="portal"]');
		const text = portal?.textContent || '';
		
		expect(text).toContain('First Pod');
		expect(text).toContain('Second Pod');
		expect(text).toContain('Third Pod');
		
		// Check order (indexOf returns position)
		const firstIndex = text.indexOf('First Pod');
		const secondIndex = text.indexOf('Second Pod');
		const thirdIndex = text.indexOf('Third Pod');
		
		expect(firstIndex).toBeGreaterThan(-1);
		expect(secondIndex).toBeGreaterThan(-1);
		expect(thirdIndex).toBeGreaterThan(-1);
		expect(firstIndex).toBeLessThan(secondIndex);
		expect(secondIndex).toBeLessThan(thirdIndex);
	});
});

// ====================
// Pod Component Tests
// ====================

describe('Pod Component', () => {
	test('registers content to the correct portal', async () => {
		const component = render(TestWithPortalAndPod, {
			portalName: 'target-portal',
			content: 'Pod Content'
		});

		await new Promise(resolve => setTimeout(resolve, 100));

		const portal = document.querySelector('[data-testid="portal"]');
		expect(portal?.textContent).toContain('Pod Content');
	});

	test('multiple Pods can target the same Portal', async () => {
		const component = render(TestMultiplePods, {
			portalName: 'shared-portal',
			podContents: ['Pod A', 'Pod B']
		});

		await new Promise(resolve => setTimeout(resolve, 100));

		const portal = document.querySelector('[data-testid="portal"]');
		expect(portal?.textContent).toContain('Pod A');
		expect(portal?.textContent).toContain('Pod B');
	});
});

// ====================
// Integration Tests
// ====================

describe('Portal-Pod Integration', () => {
	test('complete flow from Pod registration to Portal rendering', async () => {
		const component = render(TestWithPortalAndPod, {
			portalName: 'integration-test',
			content: 'Integration Content'
		});

		await new Promise(resolve => setTimeout(resolve, 100));

		// Verify the complete flow works
		const portal = document.querySelector('[data-testid="portal"]');
		expect(portal).toBeTruthy();
		expect(portal?.textContent).toContain('Integration Content');
	});

	test('multiple independent Portals with different names', async () => {
		const component = render(TestMultiplePortals, {
			portal1Name: 'header-portal',
			portal2Name: 'footer-portal',
			content1: 'Header Content',
			content2: 'Footer Content'
		});

		await new Promise(resolve => setTimeout(resolve, 100));

		const portal1 = document.querySelector('[data-testid="portal-1"]');
		const portal2 = document.querySelector('[data-testid="portal-2"]');

		expect(portal1?.textContent).toContain('Header Content');
		expect(portal1?.textContent).not.toContain('Footer Content');
		
		expect(portal2?.textContent).toContain('Footer Content');
		expect(portal2?.textContent).not.toContain('Header Content');
	});
});

// ====================
// Pod Priority Tests
// ====================

describe('Pod Priority', () => {
	test('renders prioritized Pods in ascending priority order', async () => {
		const component = render(TestPrioritizedPods, {
			portalName: 'priority-portal',
			pods: [
				{ content: 'Third', priority: 3 },
				{ content: 'First', priority: 1 },
				{ content: 'Second', priority: 2 }
			]
		});

		await new Promise(resolve => setTimeout(resolve, 100));

		const portal = document.querySelector('[data-testid="portal"]');
		const text = portal?.textContent || '';

		const firstIndex = text.indexOf('First');
		const secondIndex = text.indexOf('Second');
		const thirdIndex = text.indexOf('Third');

		expect(firstIndex).toBeLessThan(secondIndex);
		expect(secondIndex).toBeLessThan(thirdIndex);
	});

	test('un-prioritized Pods render last, after prioritized Pods, in registration order', async () => {
		const component = render(TestPrioritizedPods, {
			portalName: 'mixed-priority-portal',
			pods: [
				{ content: 'Unprioritized A' },
				{ content: 'Prioritized', priority: 1 },
				{ content: 'Unprioritized B' }
			]
		});

		await new Promise(resolve => setTimeout(resolve, 100));

		const portal = document.querySelector('[data-testid="portal"]');
		const text = portal?.textContent || '';

		const prioritizedIndex = text.indexOf('Prioritized');
		const unprioritizedAIndex = text.indexOf('Unprioritized A');
		const unprioritizedBIndex = text.indexOf('Unprioritized B');

		// The prioritized pod comes first
		expect(prioritizedIndex).toBeLessThan(unprioritizedAIndex);
		expect(prioritizedIndex).toBeLessThan(unprioritizedBIndex);

		// Unprioritized pods keep their relative registration order
		expect(unprioritizedAIndex).toBeLessThan(unprioritizedBIndex);
	});

	test('Pod moves earlier when its priority is reactively lowered', async () => {
		const component = render(TestReactivePodPriority, {
			portalName: 'reactive-priority-portal',
			initialPriority: undefined
		});

		await new Promise(resolve => setTimeout(resolve, 100));

		let portal = document.querySelector('[data-testid="portal"]');
		let text = portal?.textContent || '';

		// Unprioritized "Movable" pod starts out last
		expect(text.indexOf('Fixed A')).toBeLessThan(text.indexOf('Movable'));
		expect(text.indexOf('Fixed B')).toBeLessThan(text.indexOf('Movable'));

		const setPriorityButton = document.querySelector('[data-testid="set-priority-1"]');
		expect(setPriorityButton).toBeTruthy();
		(setPriorityButton as HTMLButtonElement).click();

		await new Promise(resolve => setTimeout(resolve, 100));

		portal = document.querySelector('[data-testid="portal"]');
		text = portal?.textContent || '';

		// After being given priority 1, "Movable" now renders first
		expect(text.indexOf('Movable')).toBeLessThan(text.indexOf('Fixed A'));
		expect(text.indexOf('Movable')).toBeLessThan(text.indexOf('Fixed B'));
	});

	test('Pod moves to the end when its priority is reactively cleared', async () => {
		const component = render(TestReactivePodPriority, {
			portalName: 'reactive-priority-clear-portal',
			initialPriority: 1
		});

		await new Promise(resolve => setTimeout(resolve, 100));

		let portal = document.querySelector('[data-testid="portal"]');
		let text = portal?.textContent || '';

		// "Movable" starts out first with priority 1
		expect(text.indexOf('Movable')).toBeLessThan(text.indexOf('Fixed A'));
		expect(text.indexOf('Movable')).toBeLessThan(text.indexOf('Fixed B'));

		const clearPriorityButton = document.querySelector('[data-testid="clear-priority"]');
		expect(clearPriorityButton).toBeTruthy();
		(clearPriorityButton as HTMLButtonElement).click();

		await new Promise(resolve => setTimeout(resolve, 100));

		portal = document.querySelector('[data-testid="portal"]');
		text = portal?.textContent || '';

		// After losing its priority, "Movable" now renders last
		expect(text.indexOf('Fixed A')).toBeLessThan(text.indexOf('Movable'));
		expect(text.indexOf('Fixed B')).toBeLessThan(text.indexOf('Movable'));
	});
});

// ====================
// Edge Cases
// ====================

describe('Edge Cases', () => {
	test('Portal handles empty string as portal name', async () => {
		const component = render(TestWithPortalAndPod, {
			portalName: '',
			content: 'Empty Name Content'
		});

		await new Promise(resolve => setTimeout(resolve, 100));

		const portal = document.querySelector('[data-testid="portal"]');
		// Should still work, just with an empty string key
		expect(portal?.textContent).toContain('Empty Name Content');
	});

	test('handles single Pod in portal',async () => {
		const component = render(TestMultiplePods, {
			portalName: 'single-pod-portal',
			podContents: ['Only Pod']
		});

		await new Promise(resolve => setTimeout(resolve, 100));

		const portal = document.querySelector('[data-testid="portal"]');
		expect(portal?.textContent).toContain('Only Pod');
	});

	test('handles many Pods in same portal', async () => {
		const manyContents = Array.from({ length: 10 }, (_, i) => `Pod ${i}`);
		
		const component = render(TestMultiplePods, {
			portalName: 'many-pods-portal',
			podContents: manyContents
		});

		await new Promise(resolve => setTimeout(resolve, 100));

		const portal = document.querySelector('[data-testid="portal"]');
		const text = portal?.textContent || '';
		
		// Verify all 10 pods are rendered
		for (let i = 0; i < 10; i++) {
			expect(text).toContain(`Pod ${i}`);
		}
	});

	test('demounts portal content when portal is hidden', async () => {
		const component = render(TestToggleablePortal, {
			portalName: 'toggleable-portal',
			content: 'Portal Content to Demount'
		});

		// Wait for initial render
		await new Promise(resolve => setTimeout(resolve, 100));

		// Verify portal and content are initially present
		let portal = document.querySelector('[data-testid="portal"]');
		expect(portal).toBeTruthy();
		expect(portal?.textContent).toContain('Portal Content to Demount');

		// Click button to hide the portal
		const toggleButton = document.querySelector('[data-testid="toggle-button"]');
		expect(toggleButton).toBeTruthy();
		
		// Simulate button click
		(toggleButton as HTMLButtonElement).click();

		// Wait for state update and re-render
		await new Promise(resolve => setTimeout(resolve, 100));

		// Verify portal element is now removed from DOM
		portal = document.querySelector('[data-testid="portal"]');
		expect(portal).toBeFalsy();

	});

	test('updates portal content when pod content changes', async () => {
		const component = render(TestReactivePodContent, {
			portalName: 'reactive-portal',
			initialContent: 'Initial Content'
		});

		// Wait for initial render
		await new Promise(resolve => setTimeout(resolve, 100));

		// Verify initial content is displayed in the portal
		let portal = document.querySelector('[data-testid="portal"]');
		expect(portal).toBeTruthy();
		expect(portal?.textContent).toContain('Initial Content');
		expect(portal?.textContent).not.toContain('Updated Content');

		// Click button to update the Pod content
		const updateButton = document.querySelector('[data-testid="update-button"]');
		expect(updateButton).toBeTruthy();
		
		// Simulate button click to change content
		(updateButton as HTMLButtonElement).click();

		// Wait for state update and re-render
		await new Promise(resolve => setTimeout(resolve, 100));

		// Verify portal now displays the updated content
		portal = document.querySelector('[data-testid="portal"]');
		expect(portal).toBeTruthy();
		expect(portal?.textContent).toContain('Updated Content');
		expect(portal?.textContent).not.toContain('Initial Content');
	});
});
