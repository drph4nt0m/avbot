import { Category, NotBot } from "@discordx/utilities";
import dayjs from "dayjs";
import utc from "dayjs/plugin/utc.js";
import type { CommandInteraction } from "discord.js";
import { ActionRowBuilder, codeBlock, EmbedBuilder, inlineCode, Message, SelectMenuBuilder, SelectMenuComponentOptionData, SelectMenuInteraction, time } from "discord.js";
import { Client, Discord, Guard, SelectMenuComponent, Slash } from "discordx";
import { injectable } from "tsyringe";

import { RequiredBotPerms } from "../guards/RequiredBotPerms.js";
import { NatsManager } from "../model/framework/manager/NatsManager.js";
import logger from "../utils/LoggerFactory.js";
import { InteractionUtils, ObjectUtil } from "../utils/Utils.js";
import { AvBotEmbedBuilder } from "../model/logic/AvBotEmbedBuilder.js";

@Discord()
@Category("Advisory")
@injectable()
export class Nats {
    static {
        dayjs.extend(utc);
    }

    public constructor(private _natsManager: NatsManager) {}

    @Slash({
        description: "Gives you the latest North Atlantic Tracks information"
    })
    @Guard(
        NotBot,
        RequiredBotPerms({
            textChannel: ["EmbedLinks"]
        })
    )
    public async nats(interaction: CommandInteraction, client: Client): Promise<void> {
        await interaction.deferReply();

        const natsEmbed = new AvBotEmbedBuilder("Flight Plan Database").setTitle("NATs").setColor("#0099ff").setTimestamp();
        try {
            const selectMenu = await this.getSelectDropdown();
            await this.showEmbedBasedOnIdent(natsEmbed);
            return InteractionUtils.replyOrFollowUp(interaction, {
                embeds: [natsEmbed],
                components: [selectMenu]
            });
        } catch (error) {
            logger.error(`[${client.shard.ids}] ${error}`);
            natsEmbed.setColor("#ff0000").setDescription(`${interaction.member}, ${error.message}`);
        }
        return InteractionUtils.replyOrFollowUp(interaction, {
            embeds: [natsEmbed]
        });
    }

    @SelectMenuComponent({
        id: "nats-selector"
    })
    private async selectCategory(interaction: SelectMenuInteraction, client: Client): Promise<Message> {
        await interaction.deferUpdate();
        const ident = interaction.values[0];
        const dropdown = await this.getSelectDropdown(ident);
        const natsEmbed = new AvBotEmbedBuilder("Flight Plan Database")
            .setTitle(`NAT: ${inlineCode(`Track ${ident}`)}`)
            .setColor("#0099ff")
            .setTimestamp();
        try {
            await this.showEmbedBasedOnIdent(natsEmbed, ident);
            return interaction.editReply({
                embeds: [natsEmbed],
                components: [dropdown]
            });
        } catch (error) {
            logger.error(`[${client.shard.ids}] ${error}`);
            natsEmbed.setColor("#ff0000").setDescription(`${interaction.member}, ${error.message}`);
        }
    }

    private async showEmbedBasedOnIdent(embed: EmbedBuilder, ident?: string): Promise<void> {
        if (!ObjectUtil.validString(ident)) {
            const allTracks = await this._natsManager.getAllTracks();
            ident = allTracks[0].ident;
            embed.setTitle(`NAT: ${inlineCode(`Track ${ident}`)}`);
        }
        const nat = await this._natsManager.getTrackInformation(ident);
        let route = "";
        nat.route.nodes.forEach((node) => {
            route += `${node.ident} `;
        });
        embed.addFields(ObjectUtil.singleFieldBuilder("Route", codeBlock(route)));
        if (nat.route.eastLevels.length > 0) {
            embed.addFields(ObjectUtil.singleFieldBuilder("East levels", `${nat.route.eastLevels.join(", ")}`));
        }
        if (nat.route.westLevels.length > 0) {
            embed.addFields(ObjectUtil.singleFieldBuilder("West levels", `${nat.route.westLevels.join(", ")}`));
        }

        const validFrom = `${dayjs(nat.validFrom).utc().format("HHmm[Z]")} (${time(dayjs(nat.validFrom).unix(), "R")})`;
        const validTo = `${dayjs(nat.validTo).utc().format("HHmm[Z]")} (${time(dayjs(nat.validTo).unix(), "R")})`;
        embed.addFields(ObjectUtil.singleFieldBuilder("Validity", `${validFrom} to ${validTo}`));
    }

    private async getSelectDropdown(defaultValue?: string): Promise<ActionRowBuilder<SelectMenuBuilder>> {
        const optionsForEmbed: SelectMenuComponentOptionData[] = [];
        const nats = await this._natsManager.getAllTracks();
        if (!ObjectUtil.validString(defaultValue)) {
            // when the dropdown is first created, just default it to the first item
            defaultValue = nats[0].ident;
        }
        for (const track of nats) {
            const trackName = `Track ${track.ident}`;
            const description = `${track.route.nodes[0].ident} - ${track.route.nodes[track.route.nodes.length - 1].ident}`;
            optionsForEmbed.push({
                label: trackName,
                description,
                value: track.ident,
                default: track.ident === defaultValue
            });
        }
        const selectMenu = new SelectMenuBuilder().addOptions(optionsForEmbed).setCustomId("nats-selector");
        return new ActionRowBuilder<SelectMenuBuilder>().addComponents(selectMenu);
    }
}
