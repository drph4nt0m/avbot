import axios from "axios";
import csv from "csvtojson/index.js";
import type {AutocompleteInteraction} from "discord.js";
import Fuse from "fuse.js";
import {singleton} from "tsyringe";

import METHOD_EXECUTOR_TIME_UNIT from "../../../enums/METHOD_EXECUTOR_TIME_UNIT.js";
import logger from "../../../utils/LoggerFactory.js";
import {ObjectUtil} from "../../../utils/Utils.js";
import type {IcaoCode} from "../../Typeings.js";
import {Property} from "../decorators/Property.js";
import {RunEvery} from "../decorators/RunEvery.js";
import type {ISearchBase} from "../ISearchBase.js";
import {defaultSearch, getFuseOptions} from "../ISearchBase.js";
import {AvFuse} from "../logic/AvFuse.js";

@singleton()
export class AirportManager implements ISearchBase<IcaoCode> {

    private _fuseCache: AvFuse<IcaoCode> = null;

    @Property("AVWX_TOKEN")
    private readonly avwxToken: string;


    @RunEvery(7, METHOD_EXECUTOR_TIME_UNIT.days, true)
    private async indexAirports(): Promise<void> {
        const callResponse = await axios.get("https://raw.githubusercontent.com/davidmegginson/ourairports-data/main/airports.csv");
        const fuseOptions = getFuseOptions<IcaoCode>(["ident", "iata_code", "name", "municipality"]);
        if (callResponse.status !== 200) {
            this._fuseCache = new AvFuse([], fuseOptions);
            return;
        }
        const result = callResponse.data;
        const json = await csv().fromString(result);
        const buildJson: IcaoCode[] = await this.buildJson(json);
        const index = Fuse.createIndex(fuseOptions.keys, buildJson);
        this._fuseCache = new AvFuse(buildJson, fuseOptions, index);
        logger.info(`indexed ${buildJson.length} icao locations`);
    }

    private async getAvwxIcaoCodes(): Promise<string[]> {
        const callResponse = await axios.get("https://avwx.rest/api/station/list", {
            headers: {
                Authorization: this.avwxToken
            }
        });
        if (callResponse.status !== 200) {
            return [];
        }
        return callResponse.data;
    }

    private async buildJson(resultData: Record<string, any>): Promise<IcaoCode[]> {
        const avwxResponse = await this.getAvwxIcaoCodes();
        const ret: IcaoCode[] = [];
        for (const key in resultData) {
            if (!Object.prototype.hasOwnProperty.call(resultData, key)) {
                continue;
            }
            const value: IcaoCode = resultData[key];
            const {ident, name, iata_code, municipality} = value;

            // check to make sure there is an Icao code and avwx supports it
            if (!ObjectUtil.validString(ident) || !avwxResponse.includes(ident)) {
                continue;
            }

            let fullName = "";
            if (ObjectUtil.validString(ident)) {
                fullName += `${ident}`;
            }
            if (ObjectUtil.validString(iata_code)) {
                fullName += `/${iata_code}`;
            }
            if (ObjectUtil.validString(name)) {
                fullName += ` (${name}`;
                fullName += ObjectUtil.validString(municipality) ? `, ${municipality})` : ")";
            }
            value.value = value.ident;
            value.fullInfo = fullName;
            ret.push(value);
        }
        return ret;
    }

    public search(interaction: AutocompleteInteraction): Fuse.FuseResult<IcaoCode>[] {
        const searchResult = defaultSearch(interaction, this._fuseCache);
        const retArr: Fuse.FuseResult<IcaoCode>[] = [];
        for (const result of searchResult) {
            const resultClone = {...result};
            resultClone.item.name = resultClone.item.fullInfo;
            retArr.push(resultClone);
        }
        return retArr;
    }

    public getAirport(icao: string): IcaoCode {
        if (!ObjectUtil.validString(icao) || icao === "ZZZZ") {
            return null;
        }
        return this._fuseCache.search(icao, {
            limit: 1
        }).pop().item;
    }
}
