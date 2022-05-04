import { Controller, Get } from "@overnightjs/core";
import type { Request, Response } from "express";
import { StatusCodes } from "http-status-codes";
import { injectAll, singleton } from "tsyringe";

import { Mongo } from "../../../model/db/Mongo.js";
import { Beans } from "../../../model/framework/DI/Beans.js";
import type { BotInfoFromApi, DiscordServerInfo, ShardGuild } from "../../../model/Typeings.js";
import { ObjectUtil } from "../../../utils/Utils.js";
import { baseController } from "../BaseController.js";

@singleton()
@Controller("api/bot")
export class BotController extends baseController {
    public constructor(@injectAll(Beans.IShardGuild) private _shardGuilds: ShardGuild[], private _mongo: Mongo) {
        super();
    }

    @Get("info")
    private async info(req: Request, res: Response): Promise<Response> {
        if (this._shardGuilds.length === 0) {
            return super.ok(res, {});
        }
        const retObj: BotInfoFromApi = {
            numberOfGuilds: this._shardGuilds.length
        };

        // non unique members
        retObj["totalMembers"] = this._shardGuilds.reduce((partialSum, a) => partialSum + a.memberCount, 0);

        // get all the members in all the guilds as an id string array
        const allMembers = this._shardGuilds.flatMap((shardGuild) => shardGuild.members.map((member) => member));

        // turn it into a set, removing duplicates
        const allMembersUnique = new Set(allMembers);

        // unique members
        retObj["totalUsersServed"] = allMembersUnique.size;

        const commandCount = await this._mongo.getCommandCounts();
        retObj["totalCommandsUsed"] = commandCount.total;
        const top = req.query.top as string;
        if (ObjectUtil.validString(top)) {
            const parsed = Number.parseInt(top);
            if (!Number.isNaN(parsed)) {
                if (parsed > this._shardGuilds.length) {
                    return super.doError(res, `You have asked for the top ${parsed} servers, but your bot is only in ${this._shardGuilds.length} servers`, StatusCodes.BAD_REQUEST);
                }
                if (parsed < 1) {
                    return super.doError(res, `top server query param must be more than 0`, StatusCodes.BAD_REQUEST);
                }
                const sorted = this._shardGuilds.sort((a, b) => b.memberCount - a.memberCount);
                const topArr: DiscordServerInfo[] = [];
                for (let i = 0; i < parsed; i++) {
                    const shardGuild = sorted[i];
                    topArr.push({
                        name: shardGuild.name,
                        iconUrl: shardGuild.iconURL,
                        members: shardGuild.memberCount
                    });
                }
                retObj["top"] = topArr;
            }
        }

        return super.ok(res, retObj);
    }
}
