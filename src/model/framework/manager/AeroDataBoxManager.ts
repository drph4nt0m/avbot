import { singleton } from "tsyringe";

import logger from "../../../utils/LoggerFactory.js";
import { ObjectUtil } from "../../../utils/Utils.js";
import type { AeroDataBoxInfo } from "../../Typeings.js";
import { Property } from "../decorators/Property.js";
import { AbstractRequestEngine } from "../engine/impl/AbstractRequestEngine.js";

@singleton()
export class AeroDataBoxManager extends AbstractRequestEngine {
    @Property("AERO_DATA_BOX_TOKEN")
    private static readonly token: string;

    public constructor() {
        super("https://aerodatabox.p.rapidapi.com/aircrafts/", {
            headers: {
                "x-rapidapi-key": AeroDataBoxManager.token
            }
        });
    }

    public async getAircraftInfo(icao24: string): Promise<AeroDataBoxInfo> {
        if (!ObjectUtil.validString(icao24)) {
            return Promise.reject(new Error(`no aircraft available at the moment with icao24 ${icao24}`));
        }
        try {
            return (await this.api.get(`/icao24/${icao24}`)).data;
        } catch (error) {
            logger.error(`[x] ${error}`);
            return Promise.reject(new Error(`no aircraft available at the moment with icao24 ${icao24}`));
        }
    }
}
