import { Colors, WebhookClient } from "discord.js";
import { ArgsOf, Discord, On } from "discordx";

import { Property } from "../model/framework/decorators/Property.js";
import type { NODE_ENV } from "../model/Typeings.js";
import logger from "../utils/LoggerFactory.js";
import { InteractionUtils, ObjectUtil } from "../utils/Utils.js";

@Discord()
export class OnShard {
    @Property("SHARD_NOTIFICATION_WEBHOOK", false)
    private readonly shardNotificationWebhook: string;

    @Property("NODE_ENV")
    private readonly environment: NODE_ENV;

    private readonly webhookClient: WebhookClient;

    public constructor() {
        if (ObjectUtil.validString(this.shardNotificationWebhook)) {
            this.webhookClient = new WebhookClient({ url: this.shardNotificationWebhook });
        }
    }

    @On()
    private async shardReady([shardId]: ArgsOf<"shardReady">): Promise<void> {
        logger.info(`Shard ${shardId} ready!`);
        await InteractionUtils.sendWebhookMessage(
            {
                title: `Shard ${shardId} ready!`,
                color: Colors.Blue
            },
            this.webhookClient
        );
    }

    @On()
    private async shardResume([shardId]: ArgsOf<"shardResume">): Promise<void> {
        logger.info(`Shard ${shardId} resumed!`);
        await InteractionUtils.sendWebhookMessage(
            {
                title: `Shard ${shardId} resumed!`,
                color: Colors.Blue
            },
            this.webhookClient
        );
    }

    @On()
    private async shardDisconnect([, shardId]: ArgsOf<"shardDisconnect">): Promise<void> {
        logger.info(`Shard ${shardId} disconnected!`);
        await InteractionUtils.sendWebhookMessage(
            {
                title: `Shard ${shardId} disconnected!`,
                color: Colors.Red
            },
            this.webhookClient
        );
    }

    @On()
    private async shardReconnecting([shardId]: ArgsOf<"shardReconnecting">): Promise<void> {
        logger.info(`Shard ${shardId} reconnecting...`);
        await InteractionUtils.sendWebhookMessage(
            {
                title: `Shard ${shardId} reconnecting...`,
                color: Colors.Yellow
            },
            this.webhookClient
        );
    }

    @On()
    private async shardError([, shardId]: ArgsOf<"shardError">): Promise<void> {
        logger.info(`Shard ${shardId} encountered a connection error!`);
        await InteractionUtils.sendWebhookMessage(
            {
                title: `Shard ${shardId} encountered a connection error!`,
                color: Colors.Red
            },
            this.webhookClient
        );
    }
}
