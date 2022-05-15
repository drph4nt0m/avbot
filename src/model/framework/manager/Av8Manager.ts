import dayjs, { Dayjs } from "dayjs";
import utc from "dayjs/plugin/utc.js";
import { singleton } from "tsyringe";

import logger from "../../../utils/LoggerFactory.js";
import { ObjectUtil } from "../../../utils/Utils.js";
import type { Notam } from "../../Typeings.js";
import { NotamType } from "../../Typeings.js";
import { Property } from "../decorators/Property.js";
import { AbstractRequestEngine } from "../engine/impl/AbstractRequestEngine.js";

@singleton()
export class Av8Manager extends AbstractRequestEngine {
    static {
        dayjs.extend(utc);
    }

    @Property("AV8_TOKEN")
    private static readonly av8Token: string;

    public constructor() {
        super("https://api.av8.dev/api/", {
            headers: {
                Authorization: Av8Manager.av8Token
            }
        });
    }

    public async getNotams(icao: string, upcoming = false): Promise<Notam[]> {
        try {
            const response = await this.api.get<{ icao: string; notams: Notam[] }>(`/notams/${icao}`);

            if (response.status !== 200) {
                return Promise.reject(new Error(`no notams available at the moment for ${icao}`));
            }

            const validNotams = response.data.notams
                .filter((notam) => notam.validity.isValid === true)
                .map((notam) => ({
                    ...notam,
                    type: notam.validity.phrase.startsWith("Will be active in") ? NotamType.UPCOMING : NotamType.ACTIVE,
                    from: notam.from !== "PERMANENT" ? dayjs(notam.from) : notam.from,
                    to: notam.to !== "PERMANENT" ? dayjs(notam.to) : notam.to
                }));

            const notams = validNotams.filter((notam) => notam.type === NotamType.ACTIVE).sort((a, b) => (b.from as Dayjs).diff(a.from as Dayjs));

            if (upcoming) {
                notams.push(...validNotams.filter((notam) => notam.type === NotamType.UPCOMING).sort((a, b) => (a.from as Dayjs).diff(b.from as Dayjs)));
            }

            if (ObjectUtil.isValidArray(notams) === false) {
                return Promise.reject(new Error(`no notams available at the moment for ${icao}`));
            }

            return notams;
        } catch (error) {
            logger.error(`[x] ${error}`);
            return Promise.reject(new Error(error.response ? error.response.data.message : `no notams available at the moment for ${icao}`));
        }
    }
}
