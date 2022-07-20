import { Category, NotBot } from "@discordx/utilities";
import { AutocompleteInteraction, CommandInteraction, EmbedBuilder, Formatters } from "discord.js";
import { Client, Discord, Guard, Slash, SlashChoice, SlashOption } from "discordx";
import { injectable } from "tsyringe";

import { GuildOnly } from "../guards/GuildOnly.js";
import { RequiredBotPerms } from "../guards/RequiredBotPerms.js";
import { AirportManager } from "../model/framework/manager/AirportManager.js";
import { PosconManager } from "../model/framework/manager/PosconManager.js";
import type { PosconAtc, PosconFlight } from "../model/Typeings.js";
import logger from "../utils/LoggerFactory.js";
import { InteractionUtils, ObjectUtil } from "../utils/Utils.js";

@Discord()
@Category("Flight Sim Network")
@injectable()
export class Poscon {
    public constructor(private _posconManager: PosconManager, private _airportManager: AirportManager) {}

    @Slash("poscon", {
        description: "Gives you the information for the chosen call sign on the POSCON network"
    })
    @Guard(
        NotBot,
        RequiredBotPerms({
            textChannel: ["EmbedLinks"]
        }),
        GuildOnly
    )
    public async poscon(
        @SlashChoice("atc", "pilot")
        @SlashOption("type", {
            description: "What type of client would you like the bot to give information for?",
            type: "STRING",
            required: true
        })
        type: "atc" | "pilot",
        @SlashOption("ident", {
            description: "What call sign or sector ID would you like the bot to give information for?",
            autocomplete: (interaction: AutocompleteInteraction) => InteractionUtils.search(interaction, PosconManager),
            type: "STRING",
            required: true
        })
        callSign: string,
        interaction: CommandInteraction,
        client: Client
    ): Promise<void> {
        await interaction.deferReply();
        callSign = callSign.toUpperCase();

        const posconEmbed = new EmbedBuilder()
            .setTitle(`POSCON: ${Formatters.inlineCode(callSign)}`)
            .setColor("#0099ff")
            .setFooter({
                text: `${client.user.username} • This is not a source for official briefing • Please use the appropriate forums • Source: POSCON API`
            })
            .setTimestamp();

        try {
            let posconClient = (await this._posconManager.getClientInfo(callSign, type)) as PosconFlight | PosconAtc;
            posconEmbed.setTitle(`POSCON: ${Formatters.inlineCode(callSign)}`);

            switch (type) {
                case "pilot":
                    posconClient = posconClient as PosconFlight;
                    const departureAirport = posconClient.flightplan?.dep ? (await this._airportManager.getAirport(posconClient.flightplan.dep)).name : "N/A";
                    const arrivalAirport = posconClient.flightplan?.dest ? (await this._airportManager.getAirport(posconClient.flightplan.dest)).name : "N/A";
                    posconEmbed.addFields(
                        {
                            name: "Call Sign",
                            value: posconClient.callsign,
                            inline: true
                        },
                        {
                            name: "ID",
                            value: posconClient.userId.toString(),
                            inline: true
                        },
                        {
                            name: "Name",
                            value: posconClient.userName.toString(),
                            inline: true
                        },
                        {
                            name: "Departure",
                            value: departureAirport,
                            inline: true
                        },
                        {
                            name: "Destination",
                            value: arrivalAirport,
                            inline: true
                        },
                        {
                            name: "Transponder",
                            value: posconClient.squawk.toString().padStart(4, "0"),
                            inline: true
                        },
                        {
                            name: "Latitude",
                            value: posconClient.position?.lat?.toString() ?? "N/A",
                            inline: true
                        },
                        {
                            name: "Longitude",
                            value: posconClient.position?.long?.toString() ?? "N/A",
                            inline: true
                        },
                        {
                            name: "Altitude",
                            value: `${posconClient.position?.alt_amsl?.toString() ?? "N/A"} ft`,
                            inline: true
                        },
                        {
                            name: "Ground Speed",
                            value: `${posconClient.position?.gs_kt?.toString() ?? 0} knots`,
                            inline: true
                        },
                        {
                            name: "Cruising Speed",
                            value: posconClient.flightplan?.cruise_spd.toString() ?? "N/A",
                            inline: true
                        },
                        {
                            name: "Cruising Level",
                            value: posconClient.flightplan?.cruise ?? "N/A",
                            inline: true
                        },
                        {
                            name: "Departure Time",
                            value: posconClient.flightplan ? posconClient.flightplan.dep_time + "Z" : "N/A",
                            inline: true
                        },
                        {
                            name: "EET",
                            value: posconClient.flightplan?.eet ?? "N/A",
                            inline: true
                        },
                        {
                            name: "Aircraft",
                            value: posconClient.flightplan?.ac_type ?? posconClient.ac_type ?? "N/A",
                            inline: true
                        },
                        {
                            name: "VHF 1",
                            value: (posconClient.freq.vhf1 / 1000).toFixed(3).toString(),
                            inline: true
                        },
                        {
                            name: "VHF 2",
                            value: (posconClient.freq.vhf2 / 1000).toFixed(3).toString(),
                            inline: true
                        },
                        {
                            name: "Airline/Operator",
                            value: posconClient.flightplan?.operator ?? posconClient.airline ?? "N/A",
                            inline: true
                        },
                        {
                            name: "Route",
                            value: Formatters.codeBlock(posconClient.flightplan?.route ?? "N/A"),
                            inline: false
                        },
                        {
                            name: "Other",
                            value: Formatters.codeBlock(posconClient.flightplan?.other ?? "N/A"),
                            inline: false
                        }
                    );
                    break;
                case "atc":
                    posconClient = posconClient as PosconAtc;
                    posconEmbed.addFields(
                        {
                            name: "Sector ID",
                            value: posconClient.position,
                            inline: true
                        },
                        {
                            name: "ID",
                            value: posconClient.userId.toString(),
                            inline: true
                        },
                        {
                            name: "Name",
                            value: posconClient.userName.toString(),
                            inline: true
                        },
                        {
                            name: "Position",
                            value: posconClient.type,
                            inline: true
                        },
                        {
                            name: "Telephony",
                            value: posconClient.telephony,
                            inline: true
                        },
                        {
                            name: "Frequency",
                            value: posconClient.vhfFreq,
                            inline: true
                        }
                    );
                    break;
            }
        } catch (e) {
            logger.error(`[${client.shard.ids}] ${e}`, e);
            posconEmbed.setColor("#ff0000").setDescription(`${interaction.member}, ${e.message}`);
        }
        return InteractionUtils.replyOrFollowUp(interaction, {
            embeds: [posconEmbed]
        });
    }

    private parseTime(time: number): string {
        return ObjectUtil.dayJsAsUtc.utc().startOf("day").add(time, "seconds").format("HHmm");
    }
}
