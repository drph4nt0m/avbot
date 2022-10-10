import { Pagination, PaginationType } from "@discordx/pagination";
import { Category, NotBot } from "@discordx/utilities";
import { ApplicationCommandOptionType, AutocompleteInteraction, codeBlock, CommandInteraction, EmbedBuilder, inlineCode } from "discord.js";
import { Client, Discord, Guard, Slash, SlashOption } from "discordx";
import { injectable } from "tsyringe";

import { RequiredBotPerms } from "../guards/RequiredBotPerms.js";
import { AirportManager } from "../model/framework/manager/AirportManager.js";
import { AvwxManager } from "../model/framework/manager/AvwxManager.js";
import logger from "../utils/LoggerFactory.js";
import { InteractionUtils, ObjectUtil } from "../utils/Utils.js";
import { AvBotEmbedBuilder } from "../model/logic/AvBotEmbedBuilder.js";

@Discord()
@Category("Advisory")
@injectable()
export class Taf {
    public constructor(private _avwxManager: AvwxManager) {}

    @Slash({
        description: "Gives you the latest TAF for the chosen airport"
    })
    @Guard(
        NotBot,
        RequiredBotPerms({
            textChannel: ["EmbedLinks"]
        })
    )
    public async taf(
        @SlashOption({
            name: "icao",
            autocomplete: (interaction: AutocompleteInteraction) => InteractionUtils.search(interaction, AirportManager),
            description: "What ICAO would you like the bot to give TAF for?",
            type: ApplicationCommandOptionType.String,
            required: true
        })
        icao: string,
        @SlashOption({
            name: "raw-only",
            description: "Gives you only the raw TAF for the chosen airport",
            required: false,
            type: ApplicationCommandOptionType.Boolean
        })
        rawOnlyData: boolean,
        interaction: CommandInteraction,
        client: Client
    ): Promise<void> {
        await interaction.deferReply();
        icao = icao.toUpperCase();

        const tafEmbed = new AvBotEmbedBuilder("AVWX")
            .setTitle(`TAF: ${inlineCode(icao)}`)
            .setColor("#0099ff")
            .setTimestamp();
        try {
            const { raw, readable } = await this._avwxManager.getTaf(icao);

            if (rawOnlyData) {
                tafEmbed.setDescription(codeBlock(raw));
                return InteractionUtils.replyOrFollowUp(interaction, {
                    embeds: [tafEmbed]
                });
            }

            if (readable.length < 600) {
                tafEmbed.addFields(
                    {
                        name: "Raw Report",
                        value: codeBlock(raw)
                    },
                    {
                        name: "Readable Report",
                        value: readable
                    }
                );

                return InteractionUtils.replyOrFollowUp(interaction, {
                    embeds: [tafEmbed]
                });
            }

            const tafEmbeds: EmbedBuilder[] = [];
            let tempEmbed = new AvBotEmbedBuilder("AVWX")
                .setTitle(`TAF: ${inlineCode(icao)}`)
                .setColor("#0099ff")
                .addFields(ObjectUtil.singleFieldBuilder("Raw Report", codeBlock(raw)))
                .setTimestamp();

            tafEmbeds.push(tempEmbed);

            const readableList = readable.split(". ");
            let buffer = "";

            for (let i = 0; i < readableList.length; i += 1) {
                const currentLine = `${readableList[i]}. `;
                buffer += currentLine;
                if (buffer.length > 600) {
                    tempEmbed = new AvBotEmbedBuilder("AVWX")
                        .setTitle(`TAF: ${inlineCode(icao)}`)
                        .setColor("#0099ff")
                        .addFields(ObjectUtil.singleFieldBuilder(`Readable Report`, buffer))
                        .setTimestamp();

                    tafEmbeds.push(tempEmbed);
                    buffer = "";
                }
            }

            tempEmbed = tafEmbed;
            if (buffer.length > 0) {
                tafEmbeds.push(tempEmbed.addFields(ObjectUtil.singleFieldBuilder(`Readable Report`, buffer)));
            }
            for (let i = 0; i < tafEmbeds.length; i += 1) {
                tafEmbeds[i].setFooter({
                    text: `Page ${i + 1} of ${tafEmbeds.length}`
                });
            }

            await new Pagination(
                interaction,
                tafEmbeds.map((taf) => ({
                    embeds: [taf]
                })),
                {
                    type: PaginationType.Button
                }
            ).send();
            return;
        } catch (error) {
            logger.error(`[${client.shard.ids}] ${error}`);
            tafEmbed.setColor("#ff0000").setDescription(`${interaction.member}, ${error.message}`);
        }

        await InteractionUtils.replyOrFollowUp(interaction, {
            embeds: [tafEmbed]
        });
    }
}
