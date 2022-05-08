import type { ChildProcess } from "child_process";
import { MultipleShardSpawnOptions, Shard, ShardingManager } from "discord.js";
import { singleton } from "tsyringe";

import TIME_UNIT from "../../enums/TIME_UNIT.js";
import { Main } from "../../main.js";
import type { DiscordServerInfo, ShardGuild, ShardInfo } from "../../model/Typeings.js";
import { ObjectUtil, Utils } from "../../utils/Utils.js";

@singleton()
export class ShardInfoService {
    public constructor(private _shardingManager: ShardingManager) {}

    public get shardIds(): number[] {
        return this._shardingManager.shardList as number[];
    }

    public async spawn(
        options: MultipleShardSpawnOptions = {
            amount: "auto",
            timeout: -1
        }
    ): Promise<(ShardInfo & { id: number })[]> {
        const spawnedShards = await this._shardingManager.spawn(options);
        if (options.delay > 0) {
            let sleepAmount = options.delay + 500;
            if (typeof options.amount === "number") {
                sleepAmount = sleepAmount * options.amount;
            }
            await Utils.sleep(sleepAmount);
        } else {
            await Utils.sleep(6000);
        }

        const retArr: (ShardInfo & { id: number })[] = [];
        for (const [id] of spawnedShards) {
            const shardInfo = await this.getShardInfo(id);
            retArr.push({
                id,
                ...shardInfo
            });
        }
        return retArr;
    }

    public respawn(shardId: number): Promise<ChildProcess> {
        const shard = this.getShard(shardId);
        if (!shard.process) {
            throw new Error("Shard is dead and can not be restarted");
        }
        return shard.respawn({
            delay: 1000,
            timeout: -1
        });
    }

    public killShard(shardId: number): void {
        const shard = this.getShard(shardId);
        if (!shard.process) {
            throw new Error("Shard is already dead");
        }
        return shard.kill();
    }

    public getAllShardInfo(): Promise<(ShardInfo & { id: number })[]> {
        const allShards = this.shardIds;
        const pArr = allShards.map((shardId) => this.getShardInfo(shardId));
        return Promise.all(pArr).then((shards) => {
            const retArr: (ShardInfo & { id: number })[] = [];
            for (let i = 0; i < shards.length; i++) {
                const shard = shards[i];
                retArr.push({
                    id: allShards[i],
                    ...shard
                });
            }
            return retArr;
        });
    }

    public async getShardInfo(shardId?: number): Promise<ShardInfo> {
        const shard = this.getShard(shardId);
        const guildShard = await this.getShardGuilds([shard]);
        const servers = this.getDiscordServerInfo(guildShard);
        const shardUptime = Main.getShardUptime(shard);
        const uptime = ObjectUtil.timeToHuman(shardUptime, TIME_UNIT.milliseconds);
        return {
            uptime,
            servers
        };
    }

    public getDiscordServerInfo(shards: ShardGuild[], limit = -1): DiscordServerInfo[] {
        const sorted = shards.sort((a, b) => b.memberCount - a.memberCount);
        if (limit < 0) {
            limit = sorted.length;
        }
        const retArr: DiscordServerInfo[] = [];
        for (let i = 0; i < limit; i++) {
            const shardGuild = sorted[i];
            retArr.push({
                name: shardGuild.name,
                iconUrl: shardGuild.iconURL,
                members: shardGuild.memberCount
            });
        }
        return retArr;
    }

    public async getShardGuilds(shards?: Shard[]): Promise<ShardGuild[]> {
        const retArr: ShardGuild[] = [];
        const shardsToUse = ObjectUtil.isValidArray(shards) ? shards : [...this._shardingManager.shards.values()];
        for (const shardRes of shardsToUse) {
            const promise = shardRes.fetchClientValue("guilds.cache") as Promise<ShardGuild[]>;
            const guilds: ShardGuild[] = await promise;
            if (ObjectUtil.isValidArray(guilds)) {
                retArr.push(...guilds);
            }
        }
        return retArr;
    }

    private getShard(shardId: number): Shard {
        const shard = this._shardingManager.shards.get(shardId);
        if (!shard) {
            throw new Error(`Shard with ID ${shardId} not found`);
        }
        return shard;
    }
}
