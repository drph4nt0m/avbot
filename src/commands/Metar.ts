import { Category, NotBot } from "@discordx/utilities";
import { AutocompleteInteraction, CommandInteraction, MessageEmbed } from "discord.js";
import { Client, Discord, Guard, Slash, SlashOption } from "discordx";
import { injectable } from "tsyringe";

import { RequiredBotPerms } from "../guards/RequiredBotPerms.js";
import { AirportManager } from "../model/framework/manager/AirportManager.js";
import { AsyncInteractionUpdateManager, ServiceRunner } from "../model/framework/manager/AsyncInteractionUpdateManager.js";
import { AvwxManager } from "../model/framework/manager/AvwxManager.js";
import type { MetarInfo } from "../model/Typeings.js";
import logger from "../utils/LoggerFactory.js";
import { InteractionUtils } from "../utils/Utils.js";

@Discord()
@Category("Weather")
@injectable()
export class Metar {
    public constructor(private _avwxManager: AvwxManager, private _asyncInteractionUpdateManager: AsyncInteractionUpdateManager<MetarInfo>) {}

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
        try {
            const data = await this._avwxManager.getMetar(icao);
            metarEmbed = this.getEmbed(data, rawOnlyData, icao);
        } catch (err) {
            logger.error(`[${client.shard.ids}] ${err}`);
            metarEmbed.setColor("#ff0000").setDescription(`${interaction.member}, ${err.message}`);
        }
        metarEmbed.setFooter({
            text: `${client.user.username} • This is not a source for official briefing • Please use the appropriate forums • Source: AVWX`
        });

        if (autoUpdate) {
            await interaction.followUp({
                embeds: [metarEmbed]
            });
            const interval = 1000;
            this._asyncInteractionUpdateManager.addAsyncWorker(
                new ServiceRunner<MetarInfo>(
                    interaction.id,
                    guildId,
                    interaction,
                    this._avwxManager.getMetar.bind(this._avwxManager, icao),
                    (data) => {
                        metarEmbed = this.getEmbed(data, rawOnlyData, icao);
                        // calculate next run here using date now and interval
                        interaction.editReply({
                            embeds: [metarEmbed]
                        });
                    },
                    interval
                )
            );
            // const persistedDocument = await this._mongo.getAutoUpdateDocument(guildId);
            // if (persistedDocument) {
            //     const metarMessageId = persistedDocument.metarMessageId;
            // }
        } else {
            return InteractionUtils.replyOrFollowUp(interaction, {
                embeds: [metarEmbed]
            });
        }
    }

    private getEmbed(data: MetarInfo, rawOnlyData: boolean, icao: string): MessageEmbed {
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
}
