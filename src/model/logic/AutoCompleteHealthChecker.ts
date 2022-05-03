import type { AxiosResponse } from "axios";
import axios from "axios";
import { singleton } from "tsyringe";

import METHOD_EXECUTOR_TIME_UNIT from "../../enums/METHOD_EXECUTOR_TIME_UNIT.js";
import logger from "../../utils/LoggerFactory.js";
import { RunEvery } from "../framework/decorators/RunEvery.js";
import { autoCompleteAppUrl } from "../framework/ISearchBase.js";

export type StatusCheckResult = { status: string };

@singleton()
export class AutoCompleteHealthChecker {
    @RunEvery(30, METHOD_EXECUTOR_TIME_UNIT.seconds)
    public async healthCheck(): Promise<void> {
        let result: AxiosResponse<StatusCheckResult> = null;
        try {
            result = await axios.get<StatusCheckResult>(`${autoCompleteAppUrl}/app/health`, {
                timeout: 10
            });
        } catch (e) {
            this.throwError(e);
        }
        if (!result) {
            this.throwError();
        }
        if (result && result.status !== 200) {
            this.throwError(result);
        }
        if (result?.data.status !== "ok") {
            this.throwError(result);
        }
    }

    private throwError(result?: AxiosResponse<StatusCheckResult>): never {
        let errorMessage = "";
        if (result) {
            errorMessage = `Unable to communicate to data endpoint: ${axios.isAxiosError(result) ? result.code : result.status} - ${axios.isAxiosError(result) ? result.message : result.statusText}`;
        } else {
            errorMessage = `Unable to communicate to data endpoint`;
        }
        logger.error(errorMessage);
        throw new Error(errorMessage);
    }
}
