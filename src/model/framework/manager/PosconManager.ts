import { singleton } from "tsyringe";

import type { PosconInfo } from "../../Typeings.js";
import { autoCompleteBaseUrl } from "../ISearchBase.js";
import { AbstractCallSignInformationManager } from "./AbstractCallSignInformationManager.js";

@singleton()
export class PosconManager extends AbstractCallSignInformationManager<PosconInfo> {
    public constructor() {
        super(`${autoCompleteBaseUrl}/flightSimNetwork/poscon`);
    }
}
