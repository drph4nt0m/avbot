import { Pagination, PaginationType } from "@discordx/pagination";
import { Category, NotBot } from "@discordx/utilities";
import { ApplicationCommandOptionType, AutocompleteInteraction, codeBlock, CommandInteraction, EmbedBuilder, inlineCode, time } from "discord.js";
import { Client, Discord, Guard, Slash, SlashOption } from "discordx";
import { injectable } from "tsyringe";

import { RequiredBotPerms } from "../guards/RequiredBotPerms.js";
import { AirportManager } from "../model/framework/manager/AirportManager.js";
import { Av8Manager } from "../model/framework/manager/Av8Manager.js";
import type { Notam } from "../model/Typeings.js";
import logger from "../utils/LoggerFactory.js";
import { InteractionUtils, ObjectUtil } from "../utils/Utils.js";

@Discord()
@Category("Advisory")
@injectable()
export class Notams {
    public constructor(private _av8Manager: Av8Manager) {}

    @Slash({
        description: "Gives you the active and upcoming NOTAMs for the chosen airport"
    })
    @Guard(
        NotBot,
        RequiredBotPerms({
            textChannel: ["EmbedLinks"]
        })
    )
    public async notam(
        @SlashOption({
            name: "icao",
            autocomplete: (interaction: AutocompleteInteraction) => InteractionUtils.search(interaction, AirportManager),
            description: "What ICAO would you like the bot to give NOTAMs for?",
            type: ApplicationCommandOptionType.String,
            required: true
        })
        icao: string,
        @SlashOption({
            name: "upcoming",
            description: "Do you also want to get upcoming NOTAMs?",
            required: false
        })
        upcoming: boolean,
        interaction: CommandInteraction,
        client: Client
    ): Promise<void> {
        await interaction.deferReply();
        icao = icao.toUpperCase();

        try {
            const notams = await this._av8Manager.getNotams(icao, upcoming);
            const notamEmbeds: EmbedBuilder[] = [];
            for (const notam of notams) {
                const notamEmbed = new EmbedBuilder()
                    .setTitle(`NOTAM: ${inlineCode(notam.id)}`)
                    .setColor("#0099ff")
                    .setFooter({
                        text: `${client.user.username} • This is not a source for official briefing • Please use the appropriate forums • Source: Av8 API`
                    })
                    .setDescription(codeBlock(notam.raw))
                    .addFields(ObjectUtil.singleFieldBuilder("Validity", this.getValidity(notam)))
                    .setTimestamp();

                notamEmbeds.push(notamEmbed);
            }
            await new Pagination(
                interaction,
                notamEmbeds.map((taf) => ({
                    embeds: [taf]
                })),
                {
                    type: PaginationType.SelectMenu,
                    placeholder: "Select NOTAM",
                    pageText: notams.map((notam) => this.getLabel(notam)),
                    showStartEnd: false,
                    dispose: true
                }
            ).send();
        } catch (err) {
            logger.error(`[${client.shard.ids}] ${err}`);
            const notamEmbed = new EmbedBuilder()
                .setTitle(`NOTAM: ${inlineCode(icao)}`)
                .setColor("#ff0000")
                .setFooter({
                    text: `${client.user.username} • This is not a source for official briefing • Please use the appropriate forums • Source: Av8 API`
                })
                .setDescription(`${interaction.member}, ${err.message}`)
                .setTimestamp();
            return InteractionUtils.replyOrFollowUp(interaction, {
                embeds: [notamEmbed]
            });
        }
    }

    private getValidity(notam: Notam): string {
        let validityStr = notam.validity.phrase;
        if (notam.from !== "PERMANENT") {
            if (notam.to === "PERMANENT") {
                validityStr += ` (Since ${time(notam.from.unix())})`;
            } else {
                validityStr += ` (${time(notam.from.unix())} to ${time(notam.to.unix())})`;
            }
        }

        return validityStr;
    }

    private getLabel(notam: Notam): string {
        let labelStr = `${notam.type}: ${notam.id}`;
        if (notam.from !== "PERMANENT") {
            if (notam.to === "PERMANENT") {
                labelStr += ` (${notam.from.format("MMM D, YYYY")} to PERM)`;
            } else {
                labelStr += ` (${notam.from.format("MMM D, YYYY")} to ${notam.to.format("MMM D, YYYY")})`;
            }
        }
        return labelStr;
    }
}
