import { singleton } from "tsyringe";

import logger from "../../../utils/LoggerFactory.js";
import type { GeonamesCoordinates, GeonamesTimeZone, LatLong } from "../../Typeings.js";
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

    public async getCoordinates(location: string): Promise<LatLong> {
        try {
            const response = await this.api.get<GeonamesCoordinates>(`/searchJSON?formatted=true&username=${this._username}&q=${location}&maxRows=1`);
            if (response.status !== 200) {
                return Promise.reject(new Error(`cannot retrieve location information`));
            }

            if (response.data.geonames.length === 0) {
                return Promise.reject(new Error(`could not find the location ${location}`));
            }
            return { latitude: response.data.geonames[0].lat, longitude: response.data.geonames[0].lng };
        } catch (error) {
            logger.error(`[x] ${error}`);
            return Promise.reject(new Error(error.message || `internal server error`));
        }
    }
}
