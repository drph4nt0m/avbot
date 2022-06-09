import { WebhookClient } from "discord.js";
import { Client, Discord, On } from "discordx";
import { injectable } from "tsyringe";

import { EMBED_COLORS } from "../enums/EMBED_COLORS.js";
import { Mongo } from "../model/db/Mongo.js";
import { Property } from "../model/framework/decorators/Property.js";
import type { NODE_ENV } from "../model/Typeings.js";
import logger from "../utils/LoggerFactory.js";
import { InteractionUtils } from "../utils/Utils.js";

@Discord()
@injectable()
export class OnShard {
    @Property("RESTART_NOTIFICATION_WEBHOOK")
    private readonly restartNotificationWebhook: string;

    @Property("NODE_ENV")
    private readonly environment: NODE_ENV;

    private webhookClient: WebhookClient;

    public constructor(private _mongo: Mongo) {
        this.webhookClient = new WebhookClient({ url: this.restartNotificationWebhook });
    }

    @On("shardReady")
    private async shardReady([shardId]: [number], client: Client): Promise<void> {
        logger.info(`Shard ${shardId} ready!`);
        console.log(client.user.avatarURL({ dynamic: false }));
        await InteractionUtils.sendWebhookMessage(this.webhookClient, client, { title: `Shard ${shardId} ready!`, color: EMBED_COLORS.INFO });
    }

    @On("shardResume")
    private async shardResume([shardId]: [number], client: Client): Promise<void> {
        logger.info(`Shard ${shardId} resumed!`);
        await InteractionUtils.sendWebhookMessage(this.webhookClient, client, { title: `Shard ${shardId} resumed!`, color: EMBED_COLORS.INFO });
    }

    @On("shardDisconnect")
    private async shardDisconnect([shardId]: [number], client: Client): Promise<void> {
        logger.info(`Shard ${shardId} disconnected!`);
        await InteractionUtils.sendWebhookMessage(this.webhookClient, client, { title: `Shard ${shardId} disconnected!`, color: EMBED_COLORS.ERROR });
    }

    @On("shardReconnecting")
    private async shardReconnecting([shardId]: [number], client: Client): Promise<void> {
        logger.info(`Shard ${shardId} reconnecting...`);
        await InteractionUtils.sendWebhookMessage(this.webhookClient, client, { title: `Shard ${shardId} reconnecting...`, color: EMBED_COLORS.DEBUG });
    }

    @On("shardError")
    private async shardError([shardId]: [number], client: Client): Promise<void> {
        logger.info(`Shard ${shardId} encountered a connection error!`);
        await InteractionUtils.sendWebhookMessage(this.webhookClient, client, { title: `Shard ${shardId} encountered a connection error!`, color: EMBED_COLORS.ERROR });
    }
}
