import { Category, NotBot } from "@discordx/utilities";
import { CommandInteraction, MessageActionRow, MessageButton, MessageEmbed } from "discord.js";
import { Client, Discord, Guard, Slash } from "discordx";
import process from "process";

import TIME_UNIT from "../enums/TIME_UNIT.js";
import { RequiredBotPerms } from "../guards/RequiredBotPerms.js";
import { InteractionUtils, ObjectUtil } from "../utils/Utils.js";

@Discord()
@Category("Utility")
export class Info {
    @Slash("info", {
        description: "Provides information about AvBot, and links for adding the bot and joining the support server"
    })
    @Guard(
        NotBot,
        RequiredBotPerms({
            textChannel: ["EMBED_LINKS"]
        })
    )
    public info(interaction: CommandInteraction, client: Client): Promise<void> {
        const infoEmbed = new MessageEmbed()
            .setTitle("AvBot")
            .setColor("#1a8fe3")
            // TODO: Change the thumbnail url after new site is deployed
            .setThumbnail("https://bot.av8.dev/assets/logo.png")
            .setFooter({
                text: `${client.user.username} • @dr_ph4nt0m#8402`
            })
            .setTimestamp();

        const inviteButton = new MessageButton()
            .setLabel("Add to Discord")
            .setStyle("LINK")
            .setURL("https://discord.com/oauth2/authorize?client_id=494888240617095168&permissions=274885302528&scope=bot%20applications.commands");
        const supportServerInvite = new MessageButton().setLabel("Join our support server").setStyle("LINK").setURL("https://discord.gg/fjNqtz6");
        const donateButton = new MessageButton().setLabel("Support Avbot").setStyle("LINK").setURL("https://go.av8.dev/donate");
        const buttonsRow = new MessageActionRow().addComponents(inviteButton, supportServerInvite, donateButton);

        const shardUptime = process.uptime();
        const humanReadableUptime = ObjectUtil.timeToHuman(shardUptime, TIME_UNIT.seconds);
        infoEmbed.addField("Uptime", humanReadableUptime);

        let foundInGuild = false;
        if (interaction.inGuild()) {
            const guild = interaction.guild;
            const botOwnerId = "442534266849460224";
            const botOwnerInGuild = guild.members.cache.has(botOwnerId);
            if (botOwnerInGuild) {
                infoEmbed.addField("Owner", `<@${botOwnerId}>`);
                foundInGuild = true;
            }
        }
        if (!foundInGuild) {
            infoEmbed.addField("Owner", "dr_ph4nt0m#8402");
        }
        return InteractionUtils.replyOrFollowUp(interaction, {
            embeds: [infoEmbed],
            components: [buttonsRow]
        });
    }
}
