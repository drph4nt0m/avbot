import { Category, NotBot } from "@discordx/utilities";
import dayjs from "dayjs";
import utc from "dayjs/plugin/utc.js";
import type { CommandInteraction } from "discord.js";
import { Formatters, MessageEmbed } from "discord.js";
import { Client, Discord, Guard, Slash, SlashOption } from "discordx";
import { injectable } from "tsyringe";

import { RequiredBotPerms } from "../guards/RequiredBotPerms.js";
import { NatsManager } from "../model/framework/manager/NatsManager.js";
import logger from "../utils/LoggerFactory.js";
import { InteractionUtils, ObjectUtil } from "../utils/Utils.js";

@Discord()
@Category("Weather")
@injectable()
export class Nats {
    static {
        dayjs.extend(utc);
    }

    public constructor(private _natsManager: NatsManager) {}

    @Slash("nats", {
        description: "Gives you the latest North Atlantic Tracks information"
    })
    @Guard(
        NotBot,
        RequiredBotPerms({
            textChannel: ["EMBED_LINKS"]
        })
    )
    public async nats(
        @SlashOption("ident", {
            description: "Which track would you like to get information about?",
            required: false
        })
        ident: string,
        interaction: CommandInteraction,
        client: Client
    ): Promise<void> {
        await interaction.deferReply();

        if (ObjectUtil.validString(ident)) {
            ident = ident.toUpperCase();

            const natsEmbed = new MessageEmbed()
                .setTitle(`NAT: ${Formatters.inlineCode(`Track ${ident}`)}`)
                .setColor("#0099ff")
                .setFooter({
                    text: client.user.username
                })
                .setTimestamp();
            try {
                const nat = await this._natsManager.getTrackInformation(ident);

                let route = "";
                nat.route.nodes.forEach((node) => {
                    route += `${node.ident} `;
                });
                natsEmbed.addField("Route", Formatters.codeBlock(route));
                if (nat.route.eastLevels.length > 0) {
                    natsEmbed.addField("East levels", `${nat.route.eastLevels.join(", ")}`);
                }
                if (nat.route.westLevels.length > 0) {
                    natsEmbed.addField("West levels", `${nat.route.westLevels.join(", ")}`);
                }

                const validFrom = `${dayjs(nat.validFrom).utc().format("HHmm[Z]")} (${Formatters.time(dayjs(nat.validFrom).unix(), "R")})`;
                const validTo = `${dayjs(nat.validTo).utc().format("HHmm[Z]")} (${Formatters.time(dayjs(nat.validTo).unix(), "R")})`;
                natsEmbed.addField("Validity", `${validFrom} to ${validTo}`);
            } catch (error) {
                logger.error(`[${client.shard.ids}] ${error}`);
                natsEmbed.setColor("#ff0000").setDescription(`${interaction.member}, ${error.message}`);
            }
            return InteractionUtils.replyOrFollowUp(interaction, {
                embeds: [natsEmbed]
            });
        }
        const natsEmbed = new MessageEmbed()
            .setTitle("NATs")
            .setColor("#0099ff")
            .setFooter({
                text: `${client.user.username} • This is not a source for official briefing • Please use the appropriate forums • Source: Flight Plan Database`
            })
            .setTimestamp();
        try {
            const nats = await this._natsManager.getAllTracks();

            nats.forEach((track) => {
                natsEmbed.addField(`Track ${track.ident}`, `${track.route.nodes[0].ident} - ${track.route.nodes[track.route.nodes.length - 1].ident}`);
            });
        } catch (error) {
            logger.error(`[${client.shard.ids}] ${error}`);
            natsEmbed.setColor("#ff0000").setDescription(`${interaction.member}, ${error.message}`);
        }
        return InteractionUtils.replyOrFollowUp(interaction, {
            embeds: [natsEmbed]
        });
    }
}
