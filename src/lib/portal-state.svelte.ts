import { setContext, getContext, type Snippet } from 'svelte';

const PORTAL_KEY = Symbol('SVELTEBAYPORTAL');

export interface BayState {
	content: Record<string, Snippet[]>;
}

export const createBay = () => {
	const state = $state<BayState>({
		content: {},
	});
	setContext(PORTAL_KEY, state);
	return state;
};

export const getBayState = () => {
	const state = getContext<BayState>(PORTAL_KEY);
	if (!state) {
		throw new Error('Bay state not found. Make sure to call createBay() in your root layout.');
	}
	return state;
};