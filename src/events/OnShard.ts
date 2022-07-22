import { Colors, WebhookClient } from "discord.js";
import { ArgsOf, Discord, On } from "discordx";
import { injectable } from "tsyringe";

import { Mongo } from "../model/db/Mongo.js";
import { Property } from "../model/framework/decorators/Property.js";
import type { NODE_ENV } from "../model/Typeings.js";
import logger from "../utils/LoggerFactory.js";
import { InteractionUtils } from "../utils/Utils.js";

@Discord()
@injectable()
export class OnShard {
    @Property("SHARD_NOTIFICATION_WEBHOOK")
    private readonly shardNotificationWebhook: string;

    @Property("NODE_ENV")
    private readonly environment: NODE_ENV;

    private webhookClient: WebhookClient;

    public constructor(private _mongo: Mongo) {
        this.webhookClient = new WebhookClient({ url: this.shardNotificationWebhook });
    }

    @On("shardReady")
    private async shardReady([shardId]: ArgsOf<"shardReady">): Promise<void> {
        logger.info(`Shard ${shardId} ready!`);
        await InteractionUtils.sendWebhookMessage(this.webhookClient, {
            title: `Shard ${shardId} ready!`,
            color: Colors.Blue
        });
    }

    @On("shardResume")
    private async shardResume([shardId]: ArgsOf<"shardResume">): Promise<void> {
        logger.info(`Shard ${shardId} resumed!`);
        await InteractionUtils.sendWebhookMessage(this.webhookClient, {
            title: `Shard ${shardId} resumed!`,
            color: Colors.Blue
        });
    }

    @On("shardDisconnect")
    private async shardDisconnect([shardId]: ArgsOf<"shardDisconnect">): Promise<void> {
        logger.info(`Shard ${shardId} disconnected!`);
        await InteractionUtils.sendWebhookMessage(this.webhookClient, {
            title: `Shard ${shardId} disconnected!`,
            color: Colors.Red
        });
    }

    @On("shardReconnecting")
    private async shardReconnecting([shardId]: ArgsOf<"shardReconnecting">): Promise<void> {
        logger.info(`Shard ${shardId} reconnecting...`);
        await InteractionUtils.sendWebhookMessage(this.webhookClient, {
            title: `Shard ${shardId} reconnecting...`,
            color: Colors.Yellow
        });
    }

    @On("shardError")
    private async shardError([shardId]: ArgsOf<"shardError">): Promise<void> {
        logger.info(`Shard ${shardId} encountered a connection error!`);
        await InteractionUtils.sendWebhookMessage(this.webhookClient, {
            title: `Shard ${shardId} encountered a connection error!`,
            color: Colors.Red
        });
    }
}
