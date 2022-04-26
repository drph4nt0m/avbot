import type {AutocompleteInteraction} from "discord.js";
import type Fuse from "fuse.js";

import {ObjectUtil} from "../../utils/Utils.js";
import type {AvFuse} from "./logic/AvFuse.js";

export type SearchBase = {
    name: string,
    value: string
};

export function getFuseOptions(keys: string[] = ["name"]) {
    return {
        keys: keys,
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
    search(interaction: AutocompleteInteraction): Fuse.FuseResult<T>[] | Promise<Fuse.FuseResult<T>[]>;
}

/**
 * Default search implementation
 * @param interaction
 * @param cache
 */
export function defaultSearch<T extends SearchBase>(interaction: AutocompleteInteraction, cache: AvFuse<T>): Fuse.FuseResult<T>[] {
    if (!cache) {
        return [];
    }
    const query = interaction.options.getFocused(true).value as string;
    if (!ObjectUtil.validString(query)) {
        return cache.getFirstNItems(25);
    }
    return cache.search(query, {
        limit: 25
    });
}
