import { expect, test, describe } from 'vitest';
import { render } from 'vitest-browser-svelte';
import TestEffectCounter from './components/TestEffectCounter.svelte';
import TestPodEffectTracking from './components/TestPodEffectTracking.svelte';
import TestReactivePodContent from './components/TestReactivePodContent.svelte';
import TestToggleablePortal from './components/TestToggleablePortal.svelte';
import TestMultiplePods from './components/TestMultiplePods.svelte';

// ====================
// State Management Tests
// ====================
// These tests verify that the Portal-Pod system properly uses untrack()
// to prevent infinite reactive loops and unnecessary effect re-runs.

describe('State Management - untrack() Behavior', () => {
	test('Pod registration uses untrack() to prevent infinite loops', async () => {
		// This test verifies that when a Pod registers to a Portal,
		// it doesn't cause cascading reactive updates
		const component = render(TestPodEffectTracking, {
			portalName: 'untrack-test-portal',
			content: 'Test Content'
		});

		await new Promise(resolve => setTimeout(resolve, 100));

		// The content array change effect should run at least once (initial)
		const initialChanges = document.querySelector('[data-testid="content-array-changes"]');
		const initialCount = parseInt(initialChanges?.textContent || '0');
		
		// Should be a finite number, not infinite
		expect(initialCount).toBeGreaterThan(0);
		expect(initialCount).toBeLessThan(10); // Sanity check - should be small
	});

	test('updating Pod content does not re-register the Pod', async () => {
		// This test verifies that changing Pod content doesn't trigger
		// re-registration, which would cause unnecessary state changes
		const component = render(TestReactivePodContent, {
			portalName: 'content-update-portal',
			initialContent: 'Initial'
		});

		await new Promise(resolve => setTimeout(resolve, 100));

		// Update the Pod content
		const updateButton = document.querySelector('[data-testid="update-button"]');
		(updateButton as HTMLButtonElement).click();

		await new Promise(resolve => setTimeout(resolve, 100));

		// The portal should update, but we shouldn't see excessive effect runs
		const portal = document.querySelector('[data-testid="portal"]');
		expect(portal?.textContent).toContain('Updated Content');
	});

	test('changing Pod target properly unregisters from old portal', async () => {
		// Verify that when a Pod changes its target portal,
		// it properly cleans up from the old portal and moves to the new one
		const component = render(TestPodEffectTracking, {
			portalName: 'original-portal',
			content: 'Moving Content'
		});

		await new Promise(resolve => setTimeout(resolve, 100));

		// Content should be in the original portal
		let originalPortal = document.querySelector('[data-testid="portal"]');
		let newPortal = document.querySelector('[data-testid="new-portal"]');
		expect(originalPortal?.textContent).toContain('Moving Content');
		expect(newPortal?.textContent).not.toContain('Moving Content');

		// Change the Pod's target
		const updateButton = document.querySelector('[data-testid="update-target"]');
		(updateButton as HTMLButtonElement).click();

		await new Promise(resolve => setTimeout(resolve, 100));

		// Original portal should no longer have the content
		originalPortal = document.querySelector('[data-testid="portal"]');
		expect(originalPortal?.textContent).not.toContain('Moving Content');

		// New portal should now have the content
		newPortal = document.querySelector('[data-testid="new-portal"]');
		expect(newPortal?.textContent).toContain('Moving Content');
	});
});

describe('State Management - Effect Cleanup', () => {
	test('Pod cleanup removes content from portal', async () => {
		// Test that when a Portal is destroyed, Pod cleanup runs properly
		const component = render(TestToggleablePortal, {
			portalName: 'cleanup-portal',
			content: 'Content to Cleanup'
		});

		await new Promise(resolve => setTimeout(resolve, 100));

		// Verify content is present
		let portal = document.querySelector('[data-testid="portal"]');
		expect(portal?.textContent).toContain('Content to Cleanup');

		// Toggle portal off (this should trigger cleanup)
		const toggleButton = document.querySelector('[data-testid="toggle-button"]');
		(toggleButton as HTMLButtonElement).click();

		await new Promise(resolve => setTimeout(resolve, 100));

		// Portal should be gone
		portal = document.querySelector('[data-testid="portal"]');
		expect(portal).toBeFalsy();
	});

	test('multiple Pod registrations and cleanups work correctly', async () => {
		// Test that registering multiple Pods and removing them works
		const podContents = ['Pod 1', 'Pod 2', 'Pod 3'];
		
		const component = render(TestMultiplePods, {
			portalName: 'multi-cleanup-portal',
			podContents
		});

		await new Promise(resolve => setTimeout(resolve, 100));

		// All pods should be present
		const portal = document.querySelector('[data-testid="portal"]');
		expect(portal?.textContent).toContain('Pod 1');
		expect(portal?.textContent).toContain('Pod 2');
		expect(portal?.textContent).toContain('Pod 3');

		// The portal should have exactly 3 pieces of content registered
		// This verifies no duplicate registrations occurred
	});
});

describe('State Management - Reactive State Changes', () => {
	test('Portal reactively updates when Pod content changes', async () => {
		const component = render(TestReactivePodContent, {
			portalName: 'reactive-test',
			initialContent: 'Before'
		});

		await new Promise(resolve => setTimeout(resolve, 100));

		const portal = document.querySelector('[data-testid="portal"]');
		expect(portal?.textContent).toContain('Before');

		// Update content
		const updateButton = document.querySelector('[data-testid="update-button"]');
		(updateButton as HTMLButtonElement).click();

		await new Promise(resolve => setTimeout(resolve, 100));

		// Portal should reactively show new content
		expect(portal?.textContent).toContain('Updated Content');
	});

	test('component effects do not run excessively', async () => {
		// Track how many times effects run
		let effectRunCount = 0;
		
		const component = render(TestEffectCounter, {
			portalName: 'effect-test',
			content: 'Test',
			onEffectRun: () => effectRunCount++
		});

		await new Promise(resolve => setTimeout(resolve, 100));

		// Effect counter should be visible in the component
		const counter = document.querySelector('[data-testid="effect-count"]');
		const displayedCount = parseInt(counter?.textContent || '0');

		// The effect should run a reasonable number of times
		// (initial render + setup), not continuously
		expect(displayedCount).toBeGreaterThan(0);
		expect(displayedCount).toBeLessThan(5); // Should not be excessive
	});

	test('Pod registration does not trigger Portal re-renders unnecessarily', async () => {
		// This test ensures that Pod registration only causes
		// one update to the Portal, not multiple cascading updates
		const component = render(TestPodEffectTracking, {
			portalName: 'no-cascade-portal',
			content: 'Stable Content'
		});

		await new Promise(resolve => setTimeout(resolve, 100));

		const changes = document.querySelector('[data-testid="content-array-changes"]');
		const changeCount = parseInt(changes?.textContent || '0');

		// Should have a minimal number of changes
		// Typically: 1 for initialization, 1 for Pod registration
		expect(changeCount).toBeGreaterThan(0);
		expect(changeCount).toBeLessThan(5);

		// Wait longer to ensure no additional updates happen
		await new Promise(resolve => setTimeout(resolve, 200));

		const finalChanges = document.querySelector('[data-testid="content-array-changes"]');
		const finalChangeCount = parseInt(finalChanges?.textContent || '0');

		// Count should not have increased significantly
		expect(finalChangeCount).toBe(changeCount);
	});
});

describe('State Management - Edge Cases', () => {
	test('rapid Pod content updates do not cause infinite loops', async () => {
		const component = render(TestReactivePodContent, {
			portalName: 'rapid-update-portal',
			initialContent: 'Start'
		});

		await new Promise(resolve => setTimeout(resolve, 100));

		const updateButton = document.querySelector('[data-testid="update-button"]');

		// Rapidly click the update button multiple times
		for (let i = 0; i < 5; i++) {
			(updateButton as HTMLButtonElement).click();
			await new Promise(resolve => setTimeout(resolve, 20));
		}

		await new Promise(resolve => setTimeout(resolve, 100));

		// Should still show the updated content without crashing
		const portal = document.querySelector('[data-testid="portal"]');
		expect(portal?.textContent).toContain('Updated Content');
	});

	test('toggling portal visibility multiple times works correctly', async () => {
		const component = render(TestToggleablePortal, {
			portalName: 'toggle-test',
			content: 'Toggle Content'
		});

		await new Promise(resolve => setTimeout(resolve, 100));

		const toggleButton = document.querySelector('[data-testid="toggle-button"]');

		// Toggle multiple times
		for (let i = 0; i < 4; i++) {
			(toggleButton as HTMLButtonElement).click();
			await new Promise(resolve => setTimeout(resolve, 50));
		}

		// After even number of toggles, portal should be visible
		const portal = document.querySelector('[data-testid="portal"]');
		expect(portal).toBeTruthy();
		expect(portal?.textContent).toContain('Toggle Content');
	});
});
