import axios from "axios";
import type { AutocompleteInteraction } from "discord.js";
import { singleton } from "tsyringe";

import type { IcaoCode } from "../../Typeings.js";
import { AbstractRequestEngine } from "../engine/impl/AbstractRequestEngine.js";
import type { ISearchBase } from "../ISearchBase.js";
import { autoCompleteBaseUrl } from "../ISearchBase.js";

@singleton()
export class AirportManager implements ISearchBase<IcaoCode> {
    public async getAirport(icao: string): Promise<IcaoCode> {
        const searchResult = await axios.get<IcaoCode>(`${autoCompleteBaseUrl}/airport/getAirport`, {
            params: {
                icao
            },
            ...AbstractRequestEngine.baseOptions
        });
        return searchResult.data;
    }

    public async search(interaction: AutocompleteInteraction): Promise<IcaoCode[]> {
        const query = interaction.options.getFocused(true).value as string;
        const searchResult = await axios.get<IcaoCode[]>(`${autoCompleteBaseUrl}/airport/search`, {
            params: {
                query,
                maxLength: 97
            },
            ...AbstractRequestEngine.baseOptions
        });
        return searchResult.data;
    }
}
