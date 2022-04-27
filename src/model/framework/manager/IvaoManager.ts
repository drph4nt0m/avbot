import type {AutocompleteInteraction} from "discord.js";
import Fuse from "fuse.js";
import {singleton} from "tsyringe";

import METHOD_EXECUTOR_TIME_UNIT from "../../../enums/METHOD_EXECUTOR_TIME_UNIT.js";
import logger from "../../../utils/LoggerFactory.js";
import {ObjectUtil} from "../../../utils/Utils.js";
import type {IvaoAtc, IvaoInfo, IvaoPilot} from "../../Typeings.js";
import {RunEvery} from "../decorators/RunEvery.js";
import {AbstractRequestEngine} from "../engine/impl/AbstractRequestEngine.js";
import type {ISearchBase, SearchBase} from "../ISearchBase.js";
import {getFuseOptions} from "../ISearchBase.js";
import {AvFuse} from "../logic/AvFuse.js";

type SearchType = SearchBase & { type: "pilot" | "atc" };

@singleton()
export class IvaoManager extends AbstractRequestEngine implements ISearchBase<SearchType> {

    public constructor() {
        super("https://api.ivao.aero/v2/tracker/whazzup");
    }

    private ivaoInfo: IvaoInfo;

    private _fuseCache: AvFuse<SearchType> = null;

    @RunEvery(3, METHOD_EXECUTOR_TIME_UNIT.minutes, true)
    private async update(): Promise<void> {
        const info = await this.api.get(null);
        if (info.status !== 200) {
            logger.error(`[x] ${info.statusText}`);
            throw new Error("Unable to download Ivao info");
        }
        this.ivaoInfo = info.data;

        this.buildSearchIndex();
    }

    private buildSearchIndex(): void {
        const searchObj: SearchType[] = [];
        const {pilots, atcs} = this.ivaoInfo.clients;
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
        logger.info(`indexed ${searchObj.length} Ivao objects`);
        this._fuseCache = new AvFuse(searchObj, fuseOptions, index);
    }

    public getClientInfo(callSign: string, type: "pilot" | "atc"): IvaoPilot | IvaoAtc {
        let retVal: IvaoPilot | IvaoAtc;
        const clients = this.ivaoInfo.clients;
        if (type === "pilot") {
            retVal = clients.pilots.find(pilot => pilot.callsign === callSign);
        } else {
            retVal = clients.atcs.find(atc => atc.callsign === callSign);
        }
        if (!retVal) {
            throw new Error(`no client available at the moment with call sign ${callSign}`);
        }
        return retVal;
    }

    public getPartialAtcClientInfo(partialCallSign): IvaoAtc[] {
        const clients = this.ivaoInfo.clients.atcs;
        const filteredResults = clients.filter(atc => atc.callsign.match(partialCallSign));
        if (ObjectUtil.isValidArray(filteredResults)) {
            return filteredResults;
        }
        throw new Error(`no client available at the moment matching call sign ${partialCallSign}`);
    }

    public search(interaction: AutocompleteInteraction): Fuse.FuseResult<SearchType>[] {
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

}
