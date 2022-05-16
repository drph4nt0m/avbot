import { singleton } from "tsyringe";

import logger from "../../../utils/LoggerFactory.js";
import type { AviationStackInfo } from "../../Typeings.js";
import { Property } from "../decorators/Property.js";
import { AbstractRequestEngine } from "../engine/impl/AbstractRequestEngine.js";

@singleton()
export class AviationStackManager extends AbstractRequestEngine {
    @Property("AVIATION_STACK_TOKEN")
    private static readonly token: string;

    public constructor() {
        super("https://api.aviationstack.com/v1/flights", {
            params: {
                access_key: AviationStackManager.token
            }
        });
    }

    public async getFlightInfo(callsign: string): Promise<AviationStackInfo> {
        try {
            const { data } = await this.api.get(null, {
                params: {
                    flight_icao: callsign,
                    flight_status: "active"
                }
            });
            if (data.data.length > 0) {
                return data.data[0];
            }
            return Promise.reject(new Error(`no aircraft available at the moment with call sign ${callsign}`));
        } catch (error) {
            logger.error(`[x] ${error}`);
            return Promise.reject(new Error(`no aircraft available at the moment with call sign ${callsign}`));
        }
    }
}
