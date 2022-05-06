import { Category, NotBot } from "@discordx/utilities";
import { CommandInteraction, MessageActionRow, MessageButton, MessageEmbed } from "discord.js";
import { Client, Discord, Guard, Slash } from "discordx";
import process from "process";

import TIME_UNIT from "../enums/TIME_UNIT.js";
import { RequiredBotPerms } from "../guards/RequiredBotPerms.js";
import { InteractionUtils, ObjectUtil } from "../utils/Utils.js";

@Discord()
@Category("Utility commands")
export class Util {
    @Slash("info", {
        // TODO: add better description
        description: "Info of this bot"
    })
    @Guard(
        NotBot,
        RequiredBotPerms({
            textChannel: ["EMBED_LINKS"]
        })
    )
    private info(interaction: CommandInteraction, client: Client): Promise<void> {
        const infoEmbed = new MessageEmbed()
            .setTitle("AvBot")
            .setColor("#1a8fe3")
            .setFooter({
                text: `${client.user.username} • @dr_ph4nt0m#8402`
            })
            .setTimestamp();

        // invite
        // TODO: Replace this URL with the direct bot invite URL, this will prevent redirects
        const inviteButton = new MessageButton().setLabel("Add to Discord").setStyle("LINK").setURL("https://go.av8.dev/invite");
        const donateButton = new MessageButton().setLabel("Support Avbot").setStyle("LINK").setURL("https://link.avbot.in/donate");
        const supportServerInvite = new MessageButton().setLabel("Join out support Server").setStyle("LINK").setURL("https://discord.gg/fjNqtz6");
        const inviteRow = new MessageActionRow().addComponents(inviteButton, donateButton, supportServerInvite);

        const shardUptime = process.uptime();
        const humanReadableUptime = ObjectUtil.timeToHuman(shardUptime, TIME_UNIT.seconds);
        infoEmbed.addField("Uptime", humanReadableUptime);
        infoEmbed.addField("Owner", "dr_ph4nt0m#8402");
        return InteractionUtils.replyOrFollowUp(interaction, {
            embeds: [infoEmbed],
            components: [inviteRow]
        });
    }
}
