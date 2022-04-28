import {singleton} from "tsyringe";

import METHOD_EXECUTOR_TIME_UNIT from "../../../enums/METHOD_EXECUTOR_TIME_UNIT.js";
import logger from "../../../utils/LoggerFactory.js";
import type {FlightSimNetwork, VatsimInfo} from "../../Typeings";
import {RunEvery} from "../decorators/RunEvery.js";
import {AbstractCallSignInformationManager} from "./AbstractCallSignInformationManager.js";

@singleton()
export class VatsimManager extends AbstractCallSignInformationManager<VatsimInfo> {

    public constructor() {
        super("https://data.vatsim.net/v3/vatsim-data.json");
    }

    @RunEvery(3, METHOD_EXECUTOR_TIME_UNIT.minutes, true)
    protected updateInfo(): Promise<void> {
        return this.update();
    }

    protected get type(): FlightSimNetwork {
        return "Vatsim";
    }

    protected async getData(): Promise<VatsimInfo> {
        const info = await this.api.get(null);
        if (info.status !== 200) {
            logger.error(`[x] ${info.statusText}`);
            throw new Error(`Unable to download ${this.type} info`);
        }
        return info.data;
    }

}
