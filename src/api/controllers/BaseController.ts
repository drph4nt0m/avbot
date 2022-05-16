import type { Response } from "express";
import { getReasonPhrase, StatusCodes } from "http-status-codes";

export abstract class BaseController {
    protected doError(res: Response, message: string, status: StatusCodes): Response {
        return res.status(status).json({
            error: `${status} ${getReasonPhrase(status)}`,
            message: message
        });
    }

    protected ok(res: Response, json: any): Response {
        const serialisedJson: string = JSON.stringify(json);
        res.setHeader("Content-Type", "application/json");
        return res.status(StatusCodes.OK).send(serialisedJson);
    }
}
