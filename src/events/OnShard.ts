import { MessageEmbed, WebhookClient } from "discord.js";
import { Client, Discord, On } from "discordx";
import { injectable } from "tsyringe";

import { Mongo } from "../model/db/Mongo.js";
import { Property } from "../model/framework/decorators/Property.js";
import type { NODE_ENV } from "../model/Typeings.js";
import logger from "../utils/LoggerFactory.js";

enum embedColors {
    INFO = "#09BC8A",
    DEBUG = "#5FBFF9",
    ERROR = "#E3655B"
}

@Discord()
@injectable()
export class OnShard {
    @Property("RESTART_NOTIFICATION_WEBHOOK")
    private readonly restartNotificationWebhook: string;

    @Property("NODE_ENV")
    private readonly environment: NODE_ENV;

    private whc: WebhookClient;

    public constructor(private _mongo: Mongo) {
        this.whc = new WebhookClient({ url: this.restartNotificationWebhook });
    }

    @On("shardReady")
    private async shardReady([shardId]: [number], client: Client): Promise<void> {
        logger.info(`Shard ${shardId} ready!`);
        console.log(client.user.avatarURL({ dynamic: false }));
        await this.sendWebhookMessage(`Shard ${shardId} ready!`, embedColors.INFO, client);
    }

    @On("shardResume")
    private async shardResume([shardId]: [number], client: Client): Promise<void> {
        logger.info(`Shard ${shardId} resumed!`);
        await this.sendWebhookMessage(`Shard ${shardId} resumed!`, embedColors.INFO, client);
    }

    @On("shardDisconnect")
    private async shardDisconnect([shardId]: [number], client: Client): Promise<void> {
        logger.info(`Shard ${shardId} disconnected!`);
        await this.sendWebhookMessage(`Shard ${shardId} disconnected!`, embedColors.ERROR, client);
    }

    @On("shardReconnecting")
    private async shardReconnecting([shardId]: [number], client: Client): Promise<void> {
        logger.info(`Shard ${shardId} reconnecting...`);
        await this.sendWebhookMessage(`Shard ${shardId} reconnecting...`, embedColors.DEBUG, client);
    }

    @On("shardError")
    private async shardError([shardId]: [number], client: Client): Promise<void> {
        logger.info(`Shard ${shardId} encountered a connection error!`);
        await this.sendWebhookMessage(`Shard ${shardId} encountered a connection error!`, embedColors.ERROR, client);
    }

    private async sendWebhookMessage(message: string, color: embedColors, client: Client): Promise<void> {
        try {
            const embed = new MessageEmbed().setTitle(message).setColor(color).setTimestamp();
            await this.whc.send({ embeds: [embed], username: client.user?.username, avatarURL: client.user?.avatarURL() });
        } catch (error) {
            logger.error(`Failed to send webhook message: "${message}"`, error);
        }
    }
}
