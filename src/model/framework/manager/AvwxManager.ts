import axios from "axios";
import type {AutocompleteInteraction} from "discord.js";
import Fuse from "fuse.js";
import accents from "remove-accents";
import {singleton} from "tsyringe";

import logger from "../../../utils/LoggerFactory.js";
import {ObjectUtil} from "../../../utils/Utils.js";
import type {IcaoCode, MetarInfo, Station, TafInfo} from "../../Typeings.js";
import {PostConstruct} from "../decorators/PostConstruct.js";
import {Property} from "../decorators/Property.js";
import {AbstractRequestEngine} from "../engine/impl/AbstractRequestEngine.js";
import type {ISearchBase} from "../ISearchBase.js";
import {defaultSearch, getFuseOptions} from "../ISearchBase.js";
import {AvFuse} from "../logic/AvFuse.js";

@singleton()
export class AvwxManager extends AbstractRequestEngine implements ISearchBase<IcaoCode> {

    private _fuseCache: AvFuse<IcaoCode> = null;

    @Property("AVWX_TOKEN")
    private static readonly avwxToken: string;

    public constructor() {
        super("https://avwx.rest/api/", {
            headers: {
                Authorization: AvwxManager.avwxToken
            }
        });
    }

    @PostConstruct
    private async init(): Promise<void> {
        const callResponse = await axios.get("https://raw.githubusercontent.com/mwgg/Airports/master/airports.json");
        const fuseOptions = getFuseOptions(["icao", "iata", "name"]);
        if (callResponse.status !== 200) {
            this._fuseCache = new AvFuse([], fuseOptions);
            return;
        }
        const result = callResponse.data;
        const buildJson: IcaoCode[] = this.buildJson(result);
        const index = Fuse.createIndex(fuseOptions.keys, buildJson);
        this._fuseCache = new AvFuse(buildJson, fuseOptions, index);
        logger.info(`indexed ${buildJson.length} icao locations`);
    }

    public async getStation(icao: string): Promise<Station> {
        try {
            const response = await this.api.get(`/station/${icao}`);
            if (response.status !== 200) {
                return Promise.reject(new Error(`no station available at the moment near ${icao}`));
            }
            return response.data;
        } catch (error) {
            logger.error(`[x] ${error}`);
            return Promise.reject(new Error(error.response ? error.response.data.error : `no station available at the moment near ${icao}`));
        }
    }

    public async getStationsByCoords(latitude: number, longitude: number, location: string): Promise<Station> {
        try {
            const response = await this.api.get(`/station/near/${latitude},${longitude}?n=10`);

            if (response.status !== 200) {
                return Promise.reject(new Error(`no station available at the moment near ${location}`));
            }
            return response.data;
        } catch (error) {
            logger.error(`[x] ${error}`);
            return Promise.reject(new Error(error.response ? error.response.data.error : `no station available at the moment near ${location}`));
        }
    }

    public async getTaf(icao: string): Promise<TafInfo> {
        try {
            const response = await this.api.get(`/taf/${icao}?options=info,translate,speech`);

            if (response.status !== 200) {
                return Promise.reject(new Error(`no station available at the moment near ${icao}`));
            }
            const taf: Record<string, any> = response.data;

            let readable = "";
            readable += "**Station : ** ";

            if (taf.info.icao) {
                readable += `${taf.info.icao}`;
            } else {
                readable += `${taf.station}`;
            }

            const station = this.getStationName(taf);

            if (ObjectUtil.validString(station)) {
                readable += ` (${station})`;
            }

            readable += "\n";

            readable += `**Observed at : ** ${ObjectUtil.dayJs.utc(taf.time.dt).format("YYYY-MM-DD HH:mm:ss [Z]")} \n`;

            readable += `**Report : ** ${taf.speech}`;

            return {
                raw: taf.raw,
                readable,
                speech: taf.speech
            };
        } catch (error) {
            logger.error(`[x] ${error}`);
            return Promise.reject(new Error(error.response ? error.response.data.error : `no station available at the moment near ${icao}`));
        }
    }

    public async getMetar(icao: string): Promise<MetarInfo> {
        try {
            const response = await this.api.get(`/metar/${icao}?options=info,translate,speech`);

            if (response.status !== 200) {
                return Promise.reject(new Error(`no station available at the moment near ${icao}`));
            }
            const metar = response.data;
            let readable = "";
            readable += "**Station : ** ";

            if (metar.info.icao) {
                readable += `${metar.info.icao}`;
            } else {
                readable += `${metar.station}`;
            }

            const station = this.getStationName(metar);

            if (ObjectUtil.validString(station)) {
                readable += ` (${station})`;
            }

            readable += "\n";

            readable += `**Observed at : ** ${ObjectUtil.dayJs.utc(metar.time.dt).format("YYYY-MM-DD HH:mm:ss [Z]")} \n`;

            if (metar.translate.wind) {
                readable += `**Wind : ** ${metar.translate.wind} \n`;
            }

            if (metar.translate.visibility) {
                readable += `**Visibility : ** ${metar.translate.visibility} \n`;
            }

            if (metar.translate.temperature) {
                readable += `**Temperature : ** ${metar.translate.temperature} \n`;
            }

            if (metar.translate.dewpoint) {
                readable += `**Dew Point : ** ${metar.translate.dewpoint} \n`;
            }

            if (metar.translate.altimeter) {
                readable += `**Altimeter : ** ${metar.translate.altimeter} \n`;
            }

            if (metar.translate.clouds) {
                readable += `**Clouds : ** ${metar.translate.clouds} \n`;
            }

            if (metar.translate.other) {
                readable += `**Weather Phenomena : ** ${metar.translate.other}\n`;
            }

            if (metar.flight_rules) {
                readable += `**Flight Rules : ** ${metar.flight_rules}`;
            }

            return {
                raw: metar.raw,
                readable,
                speech: metar.speech
            };
        } catch (error) {
            logger.error(`[x] ${error}`);
            return Promise.reject(new Error(error.response ? error.response.data.error : `no station available at the moment near ${icao}`));
        }
    }

    private getStationName({info}: Record<string, any>): string {
        let station = "";
        if (info.name || info.city) {
            if (info.name) {
                try {
                    station += `${accents.remove(info.name)}`;
                    if (info.city) {
                        try {
                            station += `, ${accents.remove(info.city)}`;
                        } catch (err) {
                            logger.error(`[x] ${err}`);
                        }
                    }
                } catch (error) {
                    logger.error(`[x] ${error}`);
                    if (info.city) {
                        try {
                            station += `${accents.remove(info.city)}`;
                        } catch (err) {
                            logger.error(`[x] ${err}`);
                        }
                    }
                }
            }
        }
        return station;
    }

    private buildJson(resultData: Record<string, any>): IcaoCode[] {
        const ret: IcaoCode[] = [];
        for (const key in resultData) {
            if (!resultData.hasOwnProperty(key)) {
                continue;
            }
            const value: IcaoCode = resultData[key];
            const {icao, name, iata} = value;
            if (!ObjectUtil.validString(icao)) {
                continue;
            }
            let fullName = "";
            if (ObjectUtil.validString(icao)) {
                fullName += `${icao} - `;
            }
            if (ObjectUtil.validString(iata)) {
                fullName += `${iata} - `;
            }
            if (ObjectUtil.validString(name)) {
                fullName += name;
            }
            value.value = value.icao;
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

}
