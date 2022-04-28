import type {AutocompleteInteraction} from "discord.js";
import Fuse from "fuse.js";

import logger from "../../../utils/LoggerFactory.js";
import {ObjectUtil} from "../../../utils/Utils.js";
import type {
    FlightSimNetwork,
    IvaoAtc,
    IvaoInfo,
    IvaoPilot,
    VatsimAtc,
    VatsimAtis,
    VatsimInfo,
    VatsimPilot
} from "../../Typeings.js";
import {AbstractRequestEngine} from "../engine/impl/AbstractRequestEngine.js";
import {getFuseOptions, ISearchBase, SearchBase} from "../ISearchBase.js";
import {AvFuse} from "../logic/AvFuse.js";

type Merged = VatsimInfo | IvaoInfo;
type SearchType = SearchBase & { type: "pilot" | "atc" };

export abstract class AbstractCallSignInformationManager<T extends Merged> extends AbstractRequestEngine implements ISearchBase<SearchType> {

    private info: Merged;
    protected abstract type: FlightSimNetwork;

    private _fuseCache: AvFuse<SearchType> = null;

    public getPartialAtcClientInfo(partialCallSign: string): (IvaoAtc | VatsimAtis)[] {
        const clients = this.isIvaoInfo(this.info) ? this.info.clients.atcs : this.info.controllers;
        const filteredResults: (IvaoAtc | VatsimAtis)[] = [];
        for (const client of clients) {
            if (client.callsign.match(partialCallSign)) {
                filteredResults.push(client);
            }
        }
        if (ObjectUtil.isValidArray(filteredResults)) {
            return filteredResults;
        }
        throw new Error(`no client available at the moment matching call sign ${partialCallSign}`);
    }

    protected async update(): Promise<void> {
        this.info = await this.getData();
        this.buildSearchIndex();
    }

    private buildSearchIndex(): void {
        const searchObj: SearchType[] = [];
        const {pilots} = this.isIvaoInfo(this.info) ? this.info.clients : this.info;
        const atcs = this.isIvaoInfo(this.info) ? this.info.clients.atcs : this.info.atis;

        for (const pilot of pilots) {
            const {callsign} = pilot;
            searchObj.push({
                name: callsign,
                value: callsign,
                type: "pilot"
            });
        }
        for (const atc of atcs) {
            const {callsign} = atc;
            searchObj.push({
                name: callsign,
                value: callsign,
                type: "atc"
            });
        }
        const fuseOptions = getFuseOptions<SearchType>();
        const index = Fuse.createIndex(fuseOptions.keys, searchObj);
        logger.info(`indexed ${searchObj.length} ${this.type} objects`);
        this._fuseCache = new AvFuse(searchObj, fuseOptions, index);
    }

    public getClientInfo(callSign: string, type: "pilot" | "atc"): IvaoPilot | IvaoAtc | VatsimPilot | VatsimAtc {
        let retVal: IvaoPilot | IvaoAtc | VatsimPilot | VatsimAtc;
        const clients = this.isIvaoInfo(this.info) ? this.info.clients : this.info;
        if (type === "pilot") {
            retVal = (clients.pilots as (IvaoPilot | VatsimPilot)[]).find(pilot => pilot.callsign === callSign);
        } else {
            const atcs: (IvaoAtc | VatsimAtc)[] = this.isIvaoInfo(this.info) ? this.info.clients.atcs : this.info.atis;
            retVal = atcs.find(atc => atc.callsign === callSign);
        }
        if (!retVal) {
            throw new Error(`no client available at the moment with call sign ${callSign}`);
        }
        return retVal;
    }

    public search(interaction: AutocompleteInteraction): Fuse.FuseResult<SearchType>[] {
        if (!this._fuseCache) {
            return [];
        }
        const query = interaction.options.getFocused(true).value as string;
        const selectedType: string = interaction.options.getString("type");
        if (!ObjectUtil.validString(query)) {
            return this._fuseCache.getFirstNItems(25, {
                key: "type",
                value: selectedType
            });
        }
        const search = this._fuseCache.search(query);
        const filteredSearch = search.filter(resultItem => resultItem.item.type === selectedType);
        if (filteredSearch.length > 25) {
            return filteredSearch.slice(0, 25);
        }
        return filteredSearch;
    }

    private isIvaoInfo(info: Merged): info is IvaoInfo {
        return this.type === "Ivao";
    }

    protected abstract updateInfo(): Promise<void>;

    protected abstract getData(): Promise<T>;

}
