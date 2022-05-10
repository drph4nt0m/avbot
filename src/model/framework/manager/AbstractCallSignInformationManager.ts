import type { AutocompleteInteraction } from "discord.js";

import logger from "../../../utils/LoggerFactory.js";
import type { IvaoAtc, IvaoInfo, IvaoPilot, VatsimAtc, VatsimInfo, VatsimPilot } from "../../Typeings.js";
import { AbstractRequestEngine } from "../engine/impl/AbstractRequestEngine.js";
import type { ISearchBase, SearchBase } from "../ISearchBase.js";

type SearchType = SearchBase & { type: "pilot" | "atc" };
type Merged = VatsimInfo | IvaoInfo;

export abstract class AbstractCallSignInformationManager<T extends Merged> extends AbstractRequestEngine implements ISearchBase<SearchType> {
    public async getInfo(): Promise<T> {
        const result = await this.api.get(`/`);
        if (result.status !== 200) {
            logger.error(`[x] ${result.data.message}`);
            throw new Error(result.data.message);
        }
        return result.data;
    }

    public async getClientInfo(callSign: string, type: "pilot" | "atc"): Promise<IvaoPilot | IvaoAtc | VatsimPilot | VatsimAtc> {
        const result = await this.api.get<IvaoPilot | IvaoAtc | VatsimPilot | VatsimAtc>("/getClientInfo", {
            params: {
                type,
                callSign
            }
        });
        if (result.status !== 200) {
            throw new Error(`no client available at the moment with call sign ${callSign}`);
        }
        return result.data;
    }

    public async search(interaction: AutocompleteInteraction): Promise<SearchType[]> {
        const selectedType: string = interaction.options.getString("type");
        const query = interaction.options.getFocused(true).value as string;
        const result = await this.api.get("/search", {
            params: {
                type: selectedType,
                query
            }
        });
        return result.data;
    }
}
