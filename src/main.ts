import "reflect-metadata";

import { ShardingManager } from "discord.js";
import dotenv from "dotenv";
import { container } from "tsyringe";

import { BotServer } from "./api/BotServer.js";
import { Property } from "./model/framework/decorators/Property.js";
import { Beans } from "./model/framework/DI/Beans.js";
import type { ShardGuild } from "./model/Typeings.js";
import logger from "./utils/LoggerFactory.js";

class Main {
    @Property("DISCORD_TOKEN")
    private static readonly token: string;

    public static async start(): Promise<void> {
        dotenv.config();
        const manager = new ShardingManager("./build/Bot.js", {
            token: Main.token
        });
        manager.on("shardCreate", (shard) => {
            logger.info(`Launched shard ${shard.id}`);
        });

        await manager.spawn({
            amount: "auto",
            // amount: Main.environment === "production" ? 4 : 1
            delay: 1000,
            timeout: -1
        });

        setTimeout(() => Main.registerShardGuilds(manager), 10000);
    }

    private static async registerShardGuilds(manager: ShardingManager): Promise<void> {
        for (const [, shard] of manager.shards) {
            const promise = shard.fetchClientValue("guilds.cache") as Promise<ShardGuild[]>;
            const guilds: ShardGuild[] = await promise;
            for (const guild of guilds) {
                container.registerInstance(Beans.IShardGuild, guild);
            }
        }
        if (!container.isRegistered(Beans.IShardGuild)) {
            container.registerInstance(Beans.IShardGuild, []);
        }
        container.resolve(BotServer);
    }
}

await Main.start();
