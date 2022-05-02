import type { AutocompleteInteraction } from "discord.js";
import type Fuse from "fuse.js";

export type SearchBase = {
    name: string;
    value: string;
};

export function getFuseOptions<T extends SearchBase>(
    keys: (keyof T)[] = ["name"]
): Fuse.IFuseOptions<any> {
    return {
        keys: keys as string[],
        minMatchCharLength: 0,
        threshold: 0.3,
        includeScore: true,
        useExtendedSearch: true,
        shouldSort: true
    };
}

/**
 * Fuse default options to comply with ISearchBase
 */
export const defaultFuseOptions = getFuseOptions();

export interface ISearchBase<T extends SearchBase> {
    /**
     * Preform a search on the Fuse container
     * @param interaction
     */
    search(interaction: AutocompleteInteraction): Promise<T[]>;
}

export const autoCompleteBaseUrl = "localhost:8083/rest";
