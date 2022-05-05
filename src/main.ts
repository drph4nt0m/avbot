import "reflect-metadata";

import { ShardingManager } from "discord.js";
import dotenv from "dotenv";
import { container } from "tsyringe";

import { BotServer } from "./api/BotServer.js";
import { Property } from "./model/framework/decorators/Property.js";
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

        setTimeout(() => {
            container.registerInstance(ShardingManager, manager);
            container.resolve(BotServer);
        }, 10000);
    }
}

await Main.start();
