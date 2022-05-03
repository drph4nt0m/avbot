import type { AutocompleteInteraction } from "discord.js";

export type SearchBase = {
    name: string;
    value: string;
};

export interface ISearchBase<T extends SearchBase> {
    /**
     * Preform a search on the search microservice
     * @param interaction
     */
    search(interaction: AutocompleteInteraction): Promise<T[]>;
}

export const autoCompleteAppUrl = "http://localhost:8083";
export const autoCompleteBaseUrl = `${autoCompleteAppUrl}/rest`;
