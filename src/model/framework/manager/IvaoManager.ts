import {singleton} from "tsyringe";

import METHOD_EXECUTOR_TIME_UNIT from "../../../enums/METHOD_EXECUTOR_TIME_UNIT.js";
import logger from "../../../utils/LoggerFactory.js";
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

    public getClientInfo(callSign: string, type: "atc"): IvaoAtc;
    public getClientInfo(callSign: string, type: "pilot"): IvaoPilot;
    public getClientInfo(callSign: string, type: "pilot" | "atc"): IvaoPilot | IvaoAtc {
        let retVal: IvaoPilot | IvaoAtc;
        if (type === "pilot") {
            retVal = this.ivaoInfo.clients.pilots.find(pilot => pilot.callsign === callSign);
        } else {
            retVal = this.ivaoInfo.clients.atcs.find(atc => atc.callsign === callSign);
        }
        if (!retVal) {
            throw new Error(`no client available at the moment with call sign ${callSign}`);
        }
        return retVal;
    }
}
