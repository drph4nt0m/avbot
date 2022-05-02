import { singleton } from "tsyringe";

import type { FlightSimNetwork, IvaoInfo } from "../../Typeings.js";
import { autoCompleteBaseUrl } from "../ISearchBase.js";
import { AbstractCallSignInformationManager } from "./AbstractCallSignInformationManager.js";

@singleton()
export class IvaoManager extends AbstractCallSignInformationManager<IvaoInfo> {
    public constructor() {
        super(`${autoCompleteBaseUrl}/flightSimNetwork/ivao`);
    }

    protected get type(): FlightSimNetwork {
        return "ivao";
    }
}
