import { Category, NotBot } from "@discordx/utilities";
import { ActionRowBuilder, ButtonBuilder, ButtonStyle, CommandInteraction, EmbedBuilder } from "discord.js";
import { Client, Discord, Guard, Slash } from "discordx";
import process from "process";

import TIME_UNIT from "../enums/TIME_UNIT.js";
import { RequiredBotPerms } from "../guards/RequiredBotPerms.js";
import { InteractionUtils, ObjectUtil } from "../utils/Utils.js";

@Discord()
@Category("Utility")
export class Info {
    @Slash({
        description: "Provides information about AvBot, and links for adding the bot and joining the support server"
    })
    @Guard(
        NotBot,
        RequiredBotPerms({
            textChannel: ["EmbedLinks"]
        })
    )
    public info(interaction: CommandInteraction, client: Client): Promise<void> {
        const infoEmbed = new EmbedBuilder()
            .setTitle(client.user.username)
            .setURL("https://bot.av8.dev")
            .setColor("#0099ff")
            .setThumbnail("https://bot.av8.dev/img/logo.png")
            .setFooter({
                text: `${client.user.username} • @dr_ph4nt0m#8402`
            })
            .setTimestamp();

        const inviteButton = new ButtonBuilder()
            .setLabel("Add to Discord")
            .setStyle(ButtonStyle.Link)
            .setURL("https://discord.com/oauth2/authorize?client_id=494888240617095168&permissions=274885302528&scope=bot%20applications.commands");
        const supportServerInvite = new ButtonBuilder().setLabel("Join our support server").setStyle(ButtonStyle.Link).setURL("https://discord.gg/fjNqtz6");
        const donateButton = new ButtonBuilder().setLabel("Support Avbot").setStyle(ButtonStyle.Link).setURL("https://go.av8.dev/donate");
        const buttonsRow = new ActionRowBuilder<ButtonBuilder>().addComponents(inviteButton, supportServerInvite, donateButton);

        const shardUptime = process.uptime();
        const humanReadableUptime = ObjectUtil.timeToHuman(shardUptime, TIME_UNIT.seconds);
        infoEmbed.addFields(ObjectUtil.singleFieldBuilder("Uptime", humanReadableUptime));

        let foundInGuild = false;
        if (interaction.inGuild()) {
            const guild = interaction.guild;
            const botOwnerId = "442534266849460224";
            const botOwnerInGuild = guild.members.cache.has(botOwnerId);
            if (botOwnerInGuild) {
                infoEmbed.addFields(ObjectUtil.singleFieldBuilder("Owner", `<@${botOwnerId}>`));
                foundInGuild = true;
            }
        }
        if (!foundInGuild) {
            infoEmbed.addFields(ObjectUtil.singleFieldBuilder("Owner", "dr_ph4nt0m#8402"));
        }
        return InteractionUtils.replyOrFollowUp(interaction, {
            embeds: [infoEmbed],
            components: [buttonsRow]
        });
    }
}
