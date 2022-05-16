import { singleton } from "tsyringe";

import logger from "../../../utils/LoggerFactory.js";
import type { GeonamesTimeZone } from "../../Typeings.js";
import { Property } from "../decorators/Property.js";
import { AbstractRequestEngine } from "../engine/impl/AbstractRequestEngine.js";

@singleton()
export class GeonamesManager extends AbstractRequestEngine {
    @Property("GEONAMES_USERNAME")
    private readonly _username: string;

    public constructor() {
        super("http://api.geonames.org/");
    }

    public async getTimezone(lat: string, long: string): Promise<GeonamesTimeZone> {
        try {
            const response = await this.api.get<GeonamesTimeZone>(`/timezoneJSON?formatted=true&username=${this._username}&lat=${lat}&lng=${long}&style=full`);

            if (response.status !== 200) {
                return Promise.reject(new Error(`cannot retrieve timezone information`));
            }

            return response.data;
        } catch (error) {
            logger.error(`[x] ${error}`);
            return Promise.reject(new Error(error.message || `internal server error`));
        }
    }
}
