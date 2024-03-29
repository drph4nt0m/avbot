import "reflect-metadata";

import { Colors, Shard, ShardingManager, WebhookClient } from "discord.js";
import dotenv from "dotenv";
import { container } from "tsyringe";

import { BotServer } from "./api/BotServer.js";
import { Property } from "./model/framework/decorators/Property.js";
import logger from "./utils/LoggerFactory.js";
import { InteractionUtils, ObjectUtil } from "./utils/Utils.js";

export class Main {
    @Property("DISCORD_TOKEN")
    private static readonly token: string;

    @Property("RESTART_NOTIFICATION_WEBHOOK", false)
    private static readonly restartNotificationWebhook: string;

    private static readonly shardUptimeMap: Map<Shard, number> = new Map();

    public static async start(): Promise<void> {
        dotenv.config();
        const manager = new ShardingManager("./build/Bot.js", {
            token: Main.token
        });

        manager.on("shardCreate", (shard) => {
            logger.info(`Launched shard ${shard.id}`);
            Main.addShardListeners([shard]);
        });

        await manager.spawn({
            amount: "auto",
            delay: 1000,
            timeout: -1
        });
        setTimeout(async () => {
            container.registerInstance(ShardingManager, manager);
            container.resolve(BotServer);
            if (ObjectUtil.validString(this.restartNotificationWebhook)) {
                const webhookClient = new WebhookClient({ url: this.restartNotificationWebhook });
                await InteractionUtils.sendWebhookMessage(
                    {
                        title: `AvBot restarted!`,
                        color: Colors.Blue,
                        footer: { text: `Shards: ${manager.shards.size}` }
                    },
                    webhookClient
                );
            }
        }, 10000);
    }

    /**
     * get shard uptime in milliseconds
     * @returns {number}
     * @param shard
     */
    public static getShardUptime(shard: Shard): number {
        if (!Main.shardUptimeMap.has(shard)) {
            return -1;
        }
        const startTime = Main.shardUptimeMap.get(shard);
        return Math.round(Date.now() - startTime);
    }

    private static addShardListeners(shards: Shard[]): void {
        for (const shard of shards) {
            shard.on("spawn", () => {
                Main.shardUptimeMap.set(shard, Date.now());
            });
            shard.on("death", () => {
                Main.shardUptimeMap.delete(shard);
            });
        }
    }
}

await Main.start();
