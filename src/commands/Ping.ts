import { Category } from "@discordx/utilities";
import { oneLine } from "common-tags";
import { CommandInteraction, Message } from "discord.js";
import { Client, Discord, Slash } from "discordx";

@Discord()
@Category("Utility")
export class Ping {
    @Slash({
        description: "Checks the AvBot's ping to the Discord server"
    })
    public async ping(interaction: CommandInteraction, client: Client): Promise<void> {
        const msg = (await interaction.reply({ content: "Pinging...", fetchReply: true })) as Message;
        const content = oneLine`
          ${msg.inGuild() ? `${interaction.member},` : ""}
          Pong! The message round-trip took
          ${msg.createdTimestamp - interaction.createdTimestamp}ms.
          ${client.ws.ping ? `The heartbeat ping is ${Math.round(client.ws.ping)}ms.` : ""}
        `;
        await msg.edit(content);
    }
}
