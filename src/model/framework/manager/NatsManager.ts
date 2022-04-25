import dayjs from "dayjs";
import isBetween from "dayjs/plugin/isBetween.js";
import {singleton} from "tsyringe";

import logger from "../../../utils/LoggerFactory.js";
import {ObjectUtil} from "../../../utils/Utils.js";
import type {Nats} from "../../Typeings.js";
import {AbstractRequestEngine} from "../engine/impl/AbstractRequestEngine.js";

dayjs.extend(isBetween);

@singleton()
export class NatsManager extends AbstractRequestEngine {

    public constructor() {
        super("https://api.flightplandatabase.com/nav/NATS");
    }

    public getAllTracks(): Promise<Nats[]> {
        return this.getNatsInfo();
    }

    public async getTrackInformation(ident: string): Promise<Nats> {
        const NatsArr = await this.getNatsInfo(ident);
        return NatsArr[0];
    }

    private async getNatsInfo(ident?: string): Promise<Nats[]> {
        const errorMessage = ObjectUtil.validString(ident) ? `no NAT available at the moment with ident ${ident}` : "no NATs available at the moment";
        try {
            const {data} = await this.api.get(null);
            let filteredNats = data.filter((nat) => dayjs().isBetween(nat.validFrom, nat.validTo, "minute", "[]"));
            if (ObjectUtil.validString(ident)) {
                filteredNats = filteredNats.filter((nat) => nat.ident === ident);
            }
            if (filteredNats.length > 0) {
                return filteredNats;
            }
            return Promise.reject(new Error(errorMessage));
        } catch (error) {
            logger.error(`[x] ${error}`);
            return Promise.reject(new Error(errorMessage));
        }
    }
}
