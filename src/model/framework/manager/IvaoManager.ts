import {singleton} from "tsyringe";

import METHOD_EXECUTOR_TIME_UNIT from "../../../enums/METHOD_EXECUTOR_TIME_UNIT.js";
import {RunEvery} from "../decorators/RunEvery.js";
import {AbstractCallSignInformationManager} from "./AbstractCallSignInformationManager.js";
import type {FlightSimNetwork} from "../../Typeings";

@singleton()
export class IvaoManager extends AbstractCallSignInformationManager {

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

}
