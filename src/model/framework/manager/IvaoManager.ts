import {singleton} from "tsyringe";

import METHOD_EXECUTOR_TIME_UNIT from "../../../enums/METHOD_EXECUTOR_TIME_UNIT.js";
import logger from "../../../utils/LoggerFactory.js";
import {ObjectUtil} from "../../../utils/Utils.js";
import type {IvaoAtc, IvaoInfo, IvaoPilot} from "../../Typeings.js";
import {RunEvery} from "../decorators/RunEvery.js";
import {AbstractRequestEngine} from "../engine/impl/AbstractRequestEngine.js";


@singleton()
export class IvaoManager extends AbstractRequestEngine {

    public constructor() {
        super("https://api.ivao.aero/v2/tracker/whazzup");
    }

    private ivaoInfo: IvaoInfo;

    @RunEvery(3, METHOD_EXECUTOR_TIME_UNIT.minutes, true)
    private async update(): Promise<void> {
        const info = await this.api.get(null);
        if (info.status !== 200) {
            logger.error(`[x] ${info.statusText}`);
            throw new Error("Unable to download Ivao info");
        }
        this.ivaoInfo = info.data;
    }

    public getClientInfo(callSign: string, type: "pilot" | "atc"): IvaoPilot | IvaoAtc {
        let retVal: IvaoPilot | IvaoAtc;
        const clients = this.ivaoInfo.clients;
        if (type === "pilot") {
            retVal = clients.pilots.find(pilot => pilot.callsign === callSign);
        } else {
            retVal = clients.atcs.find(atc => atc.callsign === callSign);
        }
        if (!retVal) {
            throw new Error(`no client available at the moment with call sign ${callSign}`);
        }
        return retVal;
    }

    public getPartialAtcClientInfo(partialCallSign): IvaoAtc[] {
        const clients = this.ivaoInfo.clients.atcs;
        const filteredResults = clients.filter(atc => atc.callsign.match(partialCallSign));
        if (ObjectUtil.isValidArray(filteredResults)) {
            return filteredResults;
        }
        throw new Error(`no client available at the moment matching call sign ${partialCallSign}`);
    }
}
