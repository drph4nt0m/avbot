import type * as Immutable from "immutable";

/**
 * Any factory annotated with @registry must implement this interface to facilitate the resolution of engines
 */
export interface IDiFactory<T> {
    /**
     * Get an immutable set of all engines this abstract factory can produce
     */
    get engines(): Immutable.Set<T>;
}
