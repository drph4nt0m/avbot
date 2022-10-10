/**
 * implementing this interface will grant the ability to get system and application props from different sources, format agnostic
 */
export interface IPropertyResolutionEngine {
    /**
     * Given a key (prop) return the value of this prop as a string, number or an object
     */
    getProperty(prop: string): PropertyType;
}

export type PropertyType = string | number | Record<string, unknown> | null;
