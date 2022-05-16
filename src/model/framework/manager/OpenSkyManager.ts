import { singleton } from "tsyringe";

import logger from "../../../utils/LoggerFactory.js";
import type { FlightInfo } from "../../Typeings.js";
import { AbstractRequestEngine } from "../engine/impl/AbstractRequestEngine.js";

@singleton()
export class OpenSkyManager extends AbstractRequestEngine {
    public constructor() {
        super("https://opensky-network.org/api/states/all");
    }

    public async getFlightInfo(callsign: string): Promise<FlightInfo> {
        try {
            const { data } = await this.api.get(null);
            const allAircraft = [].concat(data.states);
            for (const aircraft of allAircraft) {
                if (aircraft[1] && aircraft[1].trim() === callsign) {
                    return {
                        icao24: aircraft[0] ? aircraft[0].trim() : "Unknown",
                        callsign: aircraft[1] ? aircraft[1].trim() : "Unknown",
                        origin_country: aircraft[2] ? aircraft[2].trim() : "Unknown",
                        time_position: aircraft[3] ? aircraft[3] : "Unknown",
                        last_contact: aircraft[4] ? aircraft[4] : "Unknown",
                        longitude: aircraft[5] ? aircraft[5] : "Unknown",
                        latitude: aircraft[6] ? aircraft[6] : "Unknown",
                        baro_altitude: aircraft[7] ? `${(aircraft[7] * 3.28084).toFixed(0)} ft` : "On Ground",
                        on_ground: aircraft[8] ? aircraft[8] : "Unknown",
                        velocity: aircraft[9] ? `${(aircraft[9] * 1.943844).toFixed(0)} knots` : "Parked",
                        true_track: aircraft[10] ? `${aircraft[10].toFixed(0)}°` : "Unknown",
                        vertical_rate: aircraft[11] !== null ? `${(aircraft[11] * 196.8504).toFixed(0)} fpm` : "On Ground",
                        sensors: aircraft[12] ? aircraft[12] : "Unknown",
                        geo_altitude: aircraft[13] ? `${(aircraft[13] * 3.28084).toFixed(0)} ft` : "On Ground",
                        squawk: aircraft[14] ? aircraft[14].trim() : "Unknown",
                        spi: aircraft[15],
                        position_source: aircraft[16]
                    };
                }
            }
            return Promise.reject(new Error(`no aircraft available at the moment with call sign ${callsign}`));
        } catch (error) {
            logger.error(`[x] ${error}`);
            return Promise.reject(new Error(`no aircraft available at the moment with call sign ${callsign}`));
        }
    }
}
