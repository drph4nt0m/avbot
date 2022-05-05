import { Controller, Get } from "@overnightjs/core";
import type { Request, Response } from "express";
import { StatusCodes } from "http-status-codes";
import { singleton } from "tsyringe";

import { BotInfoManager } from "../../manager/BotInfoManager";
import { baseController } from "../BaseController.js";

@singleton()
@Controller("api/bot")
export class BotController extends baseController {
    public constructor(private _botInfoManager: BotInfoManager) {
        super();
    }

    @Get("info")
    private async info(req: Request, res: Response): Promise<Response> {
        try {
            const info = await this._botInfoManager.getBotInfo(req.query.top as string);
            return super.ok(res, info);
        } catch (e) {
            return super.doError(res, e.message, StatusCodes.BAD_REQUEST);
        }
    }
}
