import { Category, NotBot } from "@discordx/utilities";
import { ApplicationCommandOptionType, AutocompleteInteraction, codeBlock, CommandInteraction, inlineCode } from "discord.js";
import { Client, Discord, Guard, Slash, SlashOption } from "discordx";
import { injectable } from "tsyringe";

import { RequiredBotPerms } from "../guards/RequiredBotPerms.js";
import { AirportManager } from "../model/framework/manager/AirportManager.js";
import { AvwxManager } from "../model/framework/manager/AvwxManager.js";
import logger from "../utils/LoggerFactory.js";
import { InteractionUtils } from "../utils/Utils.js";
import { AvBotEmbedBuilder } from "../model/logic/AvBotEmbedBuilder.js";

@Discord()
@Category("Advisory")
@injectable()
export class Metar {
    public constructor(private _avwxManager: AvwxManager) {}

    @Slash({
        description: "Gives you the latest METAR for the chosen airport"
    })
    @Guard(
        NotBot,
        RequiredBotPerms({
            textChannel: ["EmbedLinks"]
        })
    )
    public async metar(
        @SlashOption({
            name: "icao",
            autocomplete: (interaction: AutocompleteInteraction) => InteractionUtils.search(interaction, AirportManager),
            description: "What ICAO would you like the bot to give METAR for?",
            type: ApplicationCommandOptionType.String,
            required: true
        })
        icao: string,
        @SlashOption({
            name: "raw-only",
            description: "Gives you only the raw METAR for the chosen airport",
            type: ApplicationCommandOptionType.Boolean,
            required: false
        })
        rawOnlyData: boolean,
        interaction: CommandInteraction,
        client: Client
    ): Promise<void> {
        await interaction.deferReply();
        icao = icao.toUpperCase();
        const metarEmbed = new AvBotEmbedBuilder("AVWX")
            .setTitle(`METAR: ${inlineCode(icao)}`)
            .setColor("#0099ff")
            .setTimestamp();
        try {
            const { raw, readable } = await this._avwxManager.getMetar(icao);
            if (rawOnlyData) {
                metarEmbed.setDescription(codeBlock(raw));
            } else {
                metarEmbed.addFields(
                    {
                        name: "Raw Report",
                        value: codeBlock(raw)
                    },
                    {
                        name: "Readable Report",
                        value: readable
                    }
                );
            }
        } catch (err) {
            logger.error(`[${client.shard.ids}] ${err}`);
            metarEmbed.setColor("#ff0000").setDescription(`${interaction.member}, ${err.message}`);
        }
        return InteractionUtils.replyOrFollowUp(interaction, {
            embeds: [metarEmbed]
        });
    }
}
