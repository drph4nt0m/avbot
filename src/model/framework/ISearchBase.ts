import type { AutocompleteInteraction } from "discord.js";

export type SearchBase = {
    name: string;
    value: string;
};

export interface ISearchBase<T extends SearchBase> {
    /**
     * Preform a search on the Fuse container
     * @param interaction
     */
    search(interaction: AutocompleteInteraction): Promise<T[]>;
}

export const autoCompleteBaseUrl = "http://localhost:8083/rest";
