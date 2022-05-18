import { Formatters, TextChannel } from "discord.js";
import type { ArgsOf, Client } from "discordx";
import { Discord, DIService, On } from "discordx";
import { container, injectable } from "tsyringe";
import type constructor from "tsyringe/dist/typings/types/constructor";

import METHOD_EXECUTOR_TIME_UNIT from "../enums/METHOD_EXECUTOR_TIME_UNIT.js";
import { Mongo } from "../model/db/Mongo.js";
import { Property } from "../model/framework/decorators/Property.js";
import { RunEvery } from "../model/framework/decorators/RunEvery.js";
import type { NODE_ENV } from "../model/Typeings.js";
import logger from "../utils/LoggerFactory.js";
import { InteractionUtils } from "../utils/Utils.js";

const { minutes } = METHOD_EXECUTOR_TIME_UNIT;

@Discord()
@injectable()
export class OnReady {
    @Property("BOT_RESTART_CHANNEL")
    private readonly botRestartChannel: string;

    @Property("NODE_ENV")
    private readonly environment: NODE_ENV;

    public constructor(private _mongo: Mongo) {}

    public initAppCommands(client: Client): Promise<void> {
        if (this.environment === "production") {
            return client.initGlobalApplicationCommands({
                log: true
            });
        }
        return client.initApplicationCommands();
    }

    @On("ready")
    private async initialise([client]: [Client]): Promise<void> {
        this.initDi();
        try {
            const restartChannel = await client.channels.fetch(this.botRestartChannel);
            if (restartChannel instanceof TextChannel) {
                await restartChannel.send(`${client.user.username} (${client.shard.ids}) restarted!`);
            }
        } catch (error) {
            logger.error(`[${client.shard.ids}] Failed to send restart message: ${error}`);
        }
        await this.initAppCommands(client);
        await this.setStatus(client);
        logger.info(`[${client.shard.ids}] Logged in as ${client.user.tag}! (${client.user.id})`);
    }

    @On("interactionCreate")
    private async intersectionInit([interaction]: ArgsOf<"interactionCreate">, client: Client): Promise<void> {
        try {
            await client.executeInteraction(interaction);
            if (interaction.isApplicationCommand()) {
                try {
                    await this._mongo.increaseCommandCount(interaction.commandName);
                } catch (e) {
                    logger.error(`[${client.shard.ids}] ${e}`, interaction);
                }
            }
        } catch (e) {
            if (interaction.isApplicationCommand() || interaction.isMessageComponent()) {
                logger.error(`[${client.shard.ids}] ${e}`, interaction);
                const channel = interaction.channel;
                if (!channel.isText() || !channel.permissionsFor(interaction.guild.me).has("SEND_MESSAGES")) {
                    return;
                }
                return InteractionUtils.replyOrFollowUp(
                    interaction,
                    `Oops, something went wrong. The best way to report this problem is to join our support server at ${Formatters.hideLinkEmbed("https://go.av8.dev/support")}.`
                );
            }
        }
    }

    private async setStatus(client: Client): Promise<void> {
        const guildsCount = (await client.shard.fetchClientValues("guilds.cache.size")).reduce((acc: number, guildCount: number) => acc + guildCount, 0);
        const commandsCount = (await this._mongo.getCommandCounts()).total;
        await client.user.setActivity({
            name: `${guildsCount} servers | ${commandsCount}+ commands used`,
            type: "WATCHING"
        });
    }

    @RunEvery(30, minutes)
    private poll(client: Client): Promise<void> {
        return this.setStatus(client);
    }

    private initDi(): void {
        const appClasses = DIService.allServices;
        for (const classRef of appClasses) {
            container.resolve(classRef as constructor<any>);
        }
    }
}
