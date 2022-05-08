import { ShardingManager } from "discord.js";
import { singleton } from "tsyringe";

import { Mongo } from "../../model/db/Mongo.js";
import type { BotInfoFromApi } from "../../model/Typeings.js";
import { ObjectUtil } from "../../utils/Utils.js";
import { ShardInfoService } from "./ShardInfoService.js";

@singleton()
export class BotInfoService {
    public constructor(private _shardingManager: ShardingManager, private _mongo: Mongo, private _shardInfoService: ShardInfoService) {}

    public async getBotInfo(top: string): Promise<BotInfoFromApi | null> {
        const guildShards = await this._shardInfoService.getShardGuilds();
        if (guildShards.length === 0) {
            return null;
        }
        const retObj: BotInfoFromApi = {
            numberOfGuilds: guildShards.length
        };

        // non unique members
        retObj["totalMembers"] = guildShards.reduce((partialSum, a) => partialSum + a.memberCount, 0);

        const commandCount = await this._mongo.getCommandCounts();
        retObj["totalCommandsUsed"] = commandCount.total;
        if (ObjectUtil.validString(top)) {
            const parsed = Number.parseInt(top);
            if (!Number.isNaN(parsed)) {
                if (parsed > guildShards.length) {
                    throw new Error(`You have asked for the top ${parsed} servers, but your bot is only in ${guildShards.length} servers`);
                }
                if (parsed < 1) {
                    throw new Error(`top server query param must be more than 0`);
                }
                retObj["top"] = this._shardInfoService.getDiscordServerInfo(guildShards);
            }
        }
        return retObj;
    }
}
