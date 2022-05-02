import { singleton } from "tsyringe";

import logger from "../../../utils/LoggerFactory.js";
import type { AircraftInfo } from "../../Typeings.js";
import { AbstractRequestEngine } from "../engine/impl/AbstractRequestEngine.js";

@singleton()
export class AirportDataManager extends AbstractRequestEngine {
    public constructor() {
        super("https://www.airport-data.com/api/ac_thumb.json", {
            params: {
                n: "N"
            }
        });
    }

    public async getAircraftImage(icao24: string): Promise<AircraftInfo> {
        try {
            const { data } = await this.api.get(null, {
                params: {
                    m: icao24
                }
            });

            if (data.data.length > 0) {
                return data.data[Math.floor(Math.random() * data.data.length)];
            }
            return Promise.reject(new Error(`no aircraft available at the moment with icao24 ${icao24}`));
        } catch (error) {
            logger.error(`[x] ${error}`);
            Promise.reject(new Error(`no aircraft available at the moment with icao24 ${icao24}`));
        }
    }
}
