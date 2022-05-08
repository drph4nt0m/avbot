import { ChildControllers, Controller, Get } from "@overnightjs/core";
import type { Request, Response } from "express";
import { StatusCodes } from "http-status-codes";
import { singleton } from "tsyringe";

import { BotInfoService } from "../../service/BotInfoService.js";
import { BaseController } from "../BaseController.js";
import { ShardController } from "./ShardController.js";

@singleton()
@Controller("api/bot")
@ChildControllers([new ShardController()])
export class BotController extends BaseController {
    public constructor(private _botInfoService: BotInfoService) {
        super();
    }

    @Get("info")
    private async info(req: Request, res: Response): Promise<Response> {
        try {
            const info = await this._botInfoService.getBotInfo(req.query.top as string);
            return super.ok(res, info);
        } catch (e) {
            return super.doError(res, e.message, StatusCodes.BAD_REQUEST);
        }
    }
}
