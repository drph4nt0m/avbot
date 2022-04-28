import axios from "axios";
import {singleton} from "tsyringe";

import METHOD_EXECUTOR_TIME_UNIT from "../../../enums/METHOD_EXECUTOR_TIME_UNIT.js";
import logger from "../../../utils/LoggerFactory.js";
import type {FlightSimNetwork, IvaoAtis, IvaoInfo} from "../../Typeings";
import {RunEvery} from "../decorators/RunEvery.js";
import {AbstractCallSignInformationManager} from "./AbstractCallSignInformationManager.js";

@singleton()
export class IvaoManager extends AbstractCallSignInformationManager<IvaoInfo> {

    public constructor() {
        super("https://api.ivao.aero/v2/tracker/whazzup");
    }

    @RunEvery(3, METHOD_EXECUTOR_TIME_UNIT.minutes, true)
    protected updateInfo(): Promise<void> {
        return this.update();
    }

    protected get type(): FlightSimNetwork {
        return "Ivao";
    }

    protected async getData(): Promise<IvaoInfo> {
        const info = await this.api.get(null);
        const atisInfo = await axios.get("https://api.ivao.aero/v2/tracker/whazzup/atis");
        if (info.status !== 200 || atisInfo.status !== 200) {
            if (info.status !== 200) {
                logger.error(`[x] ${info.statusText}`);
            }
            if (atisInfo.status !== 200) {
                logger.error(`[x] ${atisInfo.statusText}`);
            }
            throw new Error(`Unable to download ${this.type} info`);
        }
        const mainInfo: IvaoInfo = info.data;
        const atisData: IvaoAtis[] = atisInfo.data;
        const {atcs} = mainInfo.clients;
        for (const atc of atcs) {
            atc.atis = atisData.find(atis => atis.callsign === atc.callsign);
        }
        return mainInfo;
    }

}
