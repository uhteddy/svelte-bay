import { expect, test, describe } from 'vitest';
import { render } from 'vitest-browser-svelte';
import { createBay, getBayState } from '../src/lib/index.ts';
import TestWrapper from './components/TestWrapper.svelte';
import TestWithPortalAndPod from './components/TestWithPortalAndPod.svelte';
import TestMultiplePods from './components/TestMultiplePods.svelte';
import TestMultiplePortals from './components/TestMultiplePortals.svelte';
import TestToggleablePortal from './components/TestToggleablePortal.svelte';
import TestReactivePodContent from './components/TestReactivePodContent.svelte';

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

		// Verify the portal content is not in the document
		const bodyText = document.body.textContent || '';
		// Content should not appear in the portal location anymore
		const portalContent = document.querySelector('[data-testid="portal"]');
		expect(portalContent).toBeNull();
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
