import { ShardingManager } from "discord.js";
import { singleton } from "tsyringe";

import { Mongo } from "../../model/db/Mongo.js";
import type { BotInfoFromApi, DiscordServerInfo, ShardGuild } from "../../model/Typeings.js";
import { ObjectUtil } from "../../utils/Utils.js";

@singleton()
export class BotInfoManager {
    public constructor(private _shardingManager: ShardingManager, private _mongo: Mongo) {}

    public async getBotInfo(top: string): Promise<BotInfoFromApi | null> {
        const guildShards = await this.getShardGuilds();
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
                const sorted = guildShards.sort((a, b) => b.memberCount - a.memberCount);
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
        return retObj;
    }

    private async getShardGuilds(): Promise<ShardGuild[]> {
        const retArr: ShardGuild[] = [];
        for (const [, shard] of this._shardingManager.shards) {
            const promise = shard.fetchClientValue("guilds.cache") as Promise<ShardGuild[]>;
            const guilds: ShardGuild[] = await promise;
            if (ObjectUtil.isValidArray(guilds)) {
                retArr.push(...guilds);
            }
        }
        return retArr;
    }
}
