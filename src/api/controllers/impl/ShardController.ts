import { Controller, Get, Post } from "@overnightjs/core";
import type { MultipleShardSpawnOptions } from "discord.js";
import type { Request, Response } from "express";
import { StatusCodes } from "http-status-codes";
import { container } from "tsyringe";

import { ShardInfoService } from "../../service/ShardInfoService.js";
import { BaseController } from "../BaseController.js";

@Controller("shard")
export class ShardController extends BaseController {
    private readonly _shardInfoService: ShardInfoService;

    public constructor() {
        super();
        this._shardInfoService = container.resolve(ShardInfoService);
    }

    @Get("shardIds")
    private shardIds(req: Request, res: Response): Response {
        const shardIds = this._shardInfoService.shardIds;
        return super.ok(res, shardIds);
    }

    @Get("allShardInfo")
    private async allShardInfo(req: Request, res: Response): Promise<Response> {
        try {
            const allShardInfo = await this._shardInfoService.getAllShardInfo();
            return super.ok(res, allShardInfo);
        } catch (e) {
            return super.doError(res, e.message, StatusCodes.INTERNAL_SERVER_ERROR);
        }
    }

    @Get(":id([0-9]+)/shardInfo")
    private async shardInfo(req: Request, res: Response): Promise<Response> {
        try {
            const shardInfo = await this._shardInfoService.getShardInfo(Number(req.params.id));
            return super.ok(res, shardInfo);
        } catch (e) {
            return super.doError(res, e.message, StatusCodes.BAD_REQUEST);
        }
    }

    @Post(":id([0-9]+)/kill")
    private kill(req: Request, res: Response): Response {
        try {
            const shardId = Number(req.params.id);
            this._shardInfoService.killShard(shardId);
            return super.ok(res, {
                success: `Shard ${shardId} has been killed`
            });
        } catch (e) {
            return super.doError(res, e.message, StatusCodes.BAD_REQUEST);
        }
    }

    @Post(":id([0-9]+)/respawn")
    private async respawn(req: Request, res: Response): Promise<Response> {
        try {
            const shardId = Number(req.params.id);
            const process = await this._shardInfoService.respawn(shardId);
            return super.ok(res, {
                success: `Shard ${shardId} has been respawned`,
                pId: process.pid
            });
        } catch (e) {
            return super.doError(res, e.message, StatusCodes.BAD_REQUEST);
        }
    }

    @Post("spawn")
    private async spawn(req: Request, res: Response): Promise<Response> {
        const body: MultipleShardSpawnOptions = req.body;
        try {
            const result = await this._shardInfoService.spawn(body);
            return super.ok(res, {
                success: `spawned ${result.length} new shards`,
                info: result
            });
        } catch (e) {
            return super.doError(res, e.message, StatusCodes.BAD_REQUEST);
        }
    }
}
