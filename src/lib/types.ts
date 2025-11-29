export interface PortalRegistry {}

// If PortalRegistry has keys, use them. Otherwise default to string.
export type PortalName = keyof PortalRegistry extends never ? string : keyof PortalRegistry;
