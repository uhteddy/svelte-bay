export interface PortalRegistry {
	// User can augment this interface
}

// If PortalRegistry has keys, use them. Otherwise default to string.
export type PortalName = keyof PortalRegistry extends never ? string : keyof PortalRegistry;
