import {singleton} from "tsyringe";

import METHOD_EXECUTOR_TIME_UNIT from "../../../enums/METHOD_EXECUTOR_TIME_UNIT.js";
import {RunEvery} from "../decorators/RunEvery.js";
import {AbstractCallSignInformationManager} from "./AbstractCallSignInformationManager.js";

@singleton()
export class VatsimManager extends AbstractCallSignInformationManager {

    public constructor() {
        super("https://data.vatsim.net/v3/vatsim-data.json");
    }

    @RunEvery(3, METHOD_EXECUTOR_TIME_UNIT.minutes, true)
    protected updateInfo(): Promise<void> {
        return this.update();
    }

}
