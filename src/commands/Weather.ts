import { Category, NotBot } from "@discordx/utilities";
import dayjs from "dayjs";
import utc from "dayjs/plugin/utc.js";
import type { AutocompleteInteraction, CommandInteraction } from "discord.js";
import { MessageEmbed } from "discord.js";
import { Client, Discord, Guard, Slash, SlashOption } from "discordx";
import { injectable } from "tsyringe";

import { RequiredBotPerms } from "../guards/RequiredBotPerms.js";
import { AirportManager } from "../model/framework/manager/AirportManager.js";
import { AvwxManager } from "../model/framework/manager/AvwxManager.js";
import { NatsManager } from "../model/framework/manager/NatsManager.js";
import logger from "../utils/LoggerFactory.js";
import { InteractionUtils, ObjectUtil } from "../utils/Utils.js";

@Discord()
@Category("Weather commands")
@injectable()
export class Weather {
    static {
        dayjs.extend(utc);
    }

    public constructor(private _avwxManager: AvwxManager, private _natsManager: NatsManager, private _airportManager: AirportManager) {}

    @Slash("atis", {
        description: "Gives you the live ATIS for the chosen airport"
    })
    @Guard(
        NotBot,
        RequiredBotPerms({
            textChannel: ["EMBED_LINKS"]
        })
    )
    private async atis(
        @SlashOption("icao", {
            autocomplete: (interaction: AutocompleteInteraction) => InteractionUtils.search(interaction, AirportManager),
            description: "What ICAO would you like the bot to give ATIS for?",
            type: "STRING",
            required: true
        })
        icao: string,
        interaction: CommandInteraction,
        client: Client
    ): Promise<void> {
        await interaction.deferReply();
        const atisEmbed = new MessageEmbed()
            .setTitle(`ATIS for ${icao.toUpperCase()}`)
            .setFooter({
                text: `${client.user.username} • This is not a source for official briefing • Please use the appropriate forums • Source: AVWX`
            })
            .setTimestamp();
        try {
            const { speech } = await this._avwxManager.getMetar(icao);
            atisEmbed.setDescription(speech);
        } catch (error) {
            logger.error(`[${client.shard.ids}] ${error}`);
            atisEmbed.setColor("#ff0000").setDescription(`${interaction.member}, ${error.message}`);
        }

        return InteractionUtils.replyOrFollowUp(interaction, {
            embeds: [atisEmbed]
        });
    }

    @Slash("brief", {
        description: "Gives you the live METAR, zulu time and the latest chart for the chosen airport"
    })
    @Guard(
        NotBot,
        RequiredBotPerms({
            textChannel: ["EMBED_LINKS"]
        })
    )
    private async brief(
        @SlashOption("icao", {
            autocomplete: (interaction: AutocompleteInteraction) => InteractionUtils.search(interaction, AirportManager),
            description: "What ICAO would you like the bot to BRIEF you for?",
            type: "STRING",
            required: true
        })
        icao: string,
        interaction: CommandInteraction,
        client: Client
    ): Promise<void> {
        await interaction.deferReply();
        const briefEmbed = new MessageEmbed().setTitle(`BRIEF for ${icao}`).setColor("#0099ff").setTimestamp();

        const zuluTime = ObjectUtil.dayJs.utc().format("YYYY-MM-DD HH:mm:ss [Z]");
        briefEmbed.addField("**Zulu**", `${zuluTime}`);
        try {
            const { raw } = await this._avwxManager.getMetar(icao);
            briefEmbed.addField("**METAR**", raw);
        } catch (error) {
            logger.error(`[${client.shard.ids}] ${error}`);
        }

        try {
            const { raw } = await this._avwxManager.getTaf(icao);
            briefEmbed.addField("**TAF**", raw);
        } catch (error) {
            logger.error(`[${client.shard.ids}] ${error}`);
        }
        briefEmbed.setFooter({
            text: `${client.user.username} • This is not a source for official briefing • Please use the appropriate forums • Source: AVWX`
        });

        return InteractionUtils.replyOrFollowUp(interaction, {
            embeds: [briefEmbed]
        });
    }

    @Slash("nats", {
        description: "Gives you the latest North Atlantic Track information"
    })
    @Guard(
        NotBot,
        RequiredBotPerms({
            textChannel: ["EMBED_LINKS"]
        })
    )
    private async nats(
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
            const natsEmbed = new MessageEmbed()
                .setTitle(`NAT | Track ${ident}`)
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
                natsEmbed.addField("Route", `${route}`);
                if (nat.route.eastLevels.length > 0) {
                    natsEmbed.addField("East levels", `${nat.route.eastLevels.join(", ")}`);
                }
                if (nat.route.westLevels.length > 0) {
                    natsEmbed.addField("West levels", `${nat.route.westLevels.join(", ")}`);
                }

                natsEmbed.addField("Validity", `${dayjs(nat.validFrom).utc().format("YYYY-MM-DD HH:mm:ss [Z]")} to ${dayjs(nat.validTo).utc().format("YYYY-MM-DD HH:mm:ss [Z]")}`);
            } catch (error) {
                logger.error(`[${client.shard.ids}] ${error}`);
                natsEmbed.setColor("#ff0000").setDescription(`${interaction.member}, ${error.message}`);
            }
            return InteractionUtils.replyOrFollowUp(interaction, {
                embeds: [natsEmbed]
            });
        }
        const natsEmbed = new MessageEmbed()
            .setTitle("NATS")
            .setColor("#0099ff")
            .setFooter({
                text: `${client.user.username} • This is not a source for official briefing • Please use the appropriate forums • Source: Flight Plan Database`
            })
            .setTimestamp();
        try {
            const nats = await this._natsManager.getAllTracks();

            nats.forEach((track) => {
                natsEmbed.addField(`${track.ident}`, `${track.route.nodes[0].ident}-${track.route.nodes[track.route.nodes.length - 1].ident}`);
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
