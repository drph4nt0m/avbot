import { Category, NotBot } from "@discordx/utilities";
import { AutocompleteInteraction, CommandInteraction, Message, MessageEmbed } from "discord.js";
import { Client, Discord, Guard, Slash, SlashOption } from "discordx";
import { delay, injectable, registry } from "tsyringe";

import { RequiredBotPerms } from "../guards/RequiredBotPerms.js";
import { Beans } from "../model/framework/DI/Beans.js";
import type { IAsyncRegisterEngine, ResolverInfo } from "../model/framework/engine/IAsyncRegisterEngine.js";
import { AirportManager } from "../model/framework/manager/AirportManager.js";
import { AsyncInteractionUpdateManager, ServiceRunner } from "../model/framework/manager/AsyncInteractionUpdateManager.js";
import { AvwxManager } from "../model/framework/manager/AvwxManager.js";
import type { MetarInfo } from "../model/Typeings.js";
import logger from "../utils/LoggerFactory.js";
import { InteractionUtils } from "../utils/Utils.js";

@registry([{ token: Beans.IAsyncRegisterEngine, useToken: delay(() => Metar) }])
@Discord()
@Category("Weather")
@injectable()
export class Metar implements IAsyncRegisterEngine<AvwxManager> {
    public constructor(private _avwxManager: AvwxManager, private _asyncInteractionUpdateManager: AsyncInteractionUpdateManager<MetarInfo, AvwxManager>) {}

    private static async methodProxy(data: MetarInfo, messageProxy: Message, args: any[]): Promise<void> {
        const rawOnlyData: boolean = args[0];
        const icao: string = args[1];
        const metarEmbed = Metar.getEmbed(data, rawOnlyData, icao);
        // calculate next run here using date now and interval
        const result = await messageProxy.edit({
            embeds: [metarEmbed]
        });
        if (result) {
            logger.info(`Updated the content of message`);
        }
    }

    private static getEmbed(data: MetarInfo, rawOnlyData: boolean, icao: string): MessageEmbed {
        const title = rawOnlyData ? `Raw METAR for ${icao.toUpperCase()}` : `METAR for ${icao.toUpperCase()}`;
        const metarEmbed = new MessageEmbed().setTitle(title).setColor("#0099ff").setTimestamp();
        const { raw, readable } = data;
        if (rawOnlyData) {
            metarEmbed.setDescription("```" + raw + "```");
        } else {
            metarEmbed.addFields(
                {
                    name: "Raw Report",
                    value: "```" + raw + "```"
                },
                {
                    name: "Readable Report",
                    value: readable
                }
            );
        }
        return metarEmbed;
    }

    public registerAsyncResolverExecutor(bindInfo?: string[], proxyArgs?: string[]): ResolverInfo<AvwxManager> {
        return {
            method: {
                proxy: Metar.methodProxy,
                args: proxyArgs
            },
            type: "metarMessageId",
            service: {
                method: "getMetar",
                context: this._avwxManager,
                args: bindInfo
            }
        };
    }

    @Slash("metar", {
        description: "Gives you the latest METAR for the chosen airport"
    })
    @Guard(
        NotBot,
        RequiredBotPerms({
            textChannel: ["EMBED_LINKS"]
        })
    )
    private async metar(
        @SlashOption("icao", {
            autocomplete: (interaction: AutocompleteInteraction) => InteractionUtils.search(interaction, AirportManager),
            description: "What ICAO would you like the bot to give METAR for?",
            type: "STRING",
            required: true
        })
        icao: string,
        @SlashOption("raw-only", {
            description: "Gives you only the raw METAR for the chosen airport",
            required: false
        })
        rawOnlyData: boolean,
        @SlashOption("auto-update", {
            description: "Automatically updates the METAR info every minute",
            required: false
        })
        autoUpdate: boolean,
        interaction: CommandInteraction,
        client: Client
    ): Promise<void> {
        await interaction.deferReply();
        const { guildId } = interaction;
        const title = rawOnlyData ? `Raw METAR for ${icao.toUpperCase()}` : `METAR for ${icao.toUpperCase()}`;
        let metarEmbed = new MessageEmbed().setTitle(title).setColor("#0099ff").setTimestamp();
        let didFail = false;
        try {
            const data = await this._avwxManager.getMetar(icao);
            metarEmbed = Metar.getEmbed(data, rawOnlyData, icao);
        } catch (err) {
            logger.error(`[${client.shard.ids}] ${err}`);
            metarEmbed.setColor("#ff0000").setDescription(`${interaction.member}, ${err.message}`);
            didFail = true;
        }
        metarEmbed.setFooter({
            text: `${client.user.username} • This is not a source for official briefing • Please use the appropriate forums • Source: AVWX`
        });

        if (autoUpdate && !didFail) {
            const msg = await interaction.followUp({
                embeds: [metarEmbed]
            });
            if (!(msg instanceof Message)) {
                return;
            }
            const interval = 1000;
            await this._asyncInteractionUpdateManager.addAsyncWorker(
                new ServiceRunner<MetarInfo, AvwxManager>(
                    msg,
                    guildId,
                    "metarMessageId",
                    {
                        args: [rawOnlyData, icao],
                        method: Metar.methodProxy
                    },
                    {
                        method: "getMetar",
                        context: this._avwxManager,
                        args: [icao]
                    },
                    interval
                )
            );
        } else {
            return InteractionUtils.replyOrFollowUp(interaction, {
                embeds: [metarEmbed]
            });
        }
    }
}
