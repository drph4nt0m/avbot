import { singleton } from "tsyringe";

import type { VatsimInfo } from "../../Typeings.js";
import { autoCompleteBaseUrl } from "../ISearchBase.js";
import { AbstractCallSignInformationManager } from "./AbstractCallSignInformationManager.js";

@singleton()
export class VatsimManager extends AbstractCallSignInformationManager<VatsimInfo> {
    public constructor() {
        super(`${autoCompleteBaseUrl}/flightSimNetwork/vatsim`);
    }
}
