import { Category, NotBot } from "@discordx/utilities";
import { ApplicationCommandOptionType, AutocompleteInteraction, codeBlock, CommandInteraction, EmbedBuilder, inlineCode } from "discord.js";
import { Client, Discord, Guard, Slash, SlashChoice, SlashOption } from "discordx";
import { injectable } from "tsyringe";

import { GuildOnly } from "../guards/GuildOnly.js";
import { RequiredBotPerms } from "../guards/RequiredBotPerms.js";
import { AirportManager } from "../model/framework/manager/AirportManager.js";
import { VatsimManager } from "../model/framework/manager/VatsimManager.js";
import type { VatsimAtc, VatsimPilot } from "../model/Typeings.js";
import logger from "../utils/LoggerFactory.js";
import { InteractionUtils } from "../utils/Utils.js";

@Discord()
@Category("Flight Sim Network")
@injectable()
export class Vatsim {
    public constructor(private _vatsimManager: VatsimManager, private _airportManager: AirportManager) {}

    @Slash({
        description: "Gives you the information for the chosen call sign on the VATSIM network"
    })
    @Guard(
        NotBot,
        RequiredBotPerms({
            textChannel: ["EmbedLinks"]
        }),
        GuildOnly
    )
    public async vatsim(
        @SlashChoice("atc", "pilot")
        @SlashOption({
            name: "type",
            description: "What type of client would you like the bot to give information for?",
            type: ApplicationCommandOptionType.String,
            required: true
        })
        type: "atc" | "pilot",
        @SlashOption({
            name: "call-sign",
            description: "What call sign would you like the bot to give information for?",
            autocomplete: (interaction: AutocompleteInteraction) => InteractionUtils.search(interaction, VatsimManager),
            type: ApplicationCommandOptionType.String,
            required: true
        })
        callSign: string,
        interaction: CommandInteraction,
        client: Client
    ): Promise<void> {
        await interaction.deferReply();
        callSign = callSign.toUpperCase();

        const vatsimEmbed = new EmbedBuilder()
            .setTitle(`VATSIM: ${inlineCode(callSign)}`)
            .setColor("#0099ff")
            .setFooter({
                text: `${client.user.username} • This is not a source for official briefing • Please use the appropriate forums • Source: VATSIM API`
            })
            .setTimestamp();

        try {
            let vatsimClient = (await this._vatsimManager.getClientInfo(callSign, type)) as VatsimPilot | VatsimAtc;
            vatsimEmbed.addFields(
                {
                    name: "Call Sign",
                    value: vatsimClient.callsign,
                    inline: true
                },
                {
                    name: "CID",
                    value: vatsimClient.cid.toString(),
                    inline: true
                },
                {
                    name: "Name",
                    value: vatsimClient.name,
                    inline: true
                }
            );
            switch (type) {
                case "pilot":
                    vatsimClient = vatsimClient as VatsimPilot;
                    const departureAirport = vatsimClient.flight_plan ? await this._airportManager.getAirport(vatsimClient.flight_plan?.departure) : { name: "NA" };
                    const arrivalAirport = vatsimClient.flight_plan ? await this._airportManager.getAirport(vatsimClient.flight_plan?.arrival) : { name: "NA" };
                    vatsimEmbed.addFields(
                        {
                            name: "Departure",
                            value: departureAirport.name,
                            inline: true
                        },
                        {
                            name: "Destination",
                            value: arrivalAirport.name,
                            inline: true
                        },
                        {
                            name: "Transponder",
                            value: vatsimClient.transponder,
                            inline: true
                        },
                        {
                            name: "Latitude",
                            value: vatsimClient.latitude.toString(),
                            inline: true
                        },
                        {
                            name: "Longitude",
                            value: vatsimClient.longitude.toString(),
                            inline: true
                        },
                        {
                            name: "Altitude",
                            value: `${vatsimClient.altitude} ft`,
                            inline: true
                        },
                        {
                            name: "Ground Speed",
                            value: `${vatsimClient.groundspeed} knots`,
                            inline: true
                        },
                        {
                            name: "Cruising Speed",
                            value: vatsimClient.flight_plan?.cruise_tas ?? "NA",
                            inline: true
                        },
                        {
                            name: "Cruising Level",
                            value: vatsimClient.flight_plan?.alternate ?? "NA",
                            inline: true
                        },
                        {
                            name: "Departure Time",
                            value: vatsimClient.flight_plan ? vatsimClient.flight_plan?.deptime?.toString().padStart(4, "0") + "Z" : "NA",
                            inline: true
                        },
                        {
                            name: "EET",
                            value: vatsimClient.flight_plan?.enroute_time?.toString().padStart(4, "0") ?? "NA",
                            inline: true
                        },
                        {
                            name: "Aircraft",
                            value: vatsimClient.flight_plan?.aircraft_faa ?? "NA",
                            inline: true
                        },
                        {
                            name: "Route",
                            value: codeBlock(vatsimClient.flight_plan?.route ?? "NA"),
                            inline: false
                        },
                        {
                            name: "Remakes",
                            value: codeBlock(vatsimClient.flight_plan?.remarks ?? "NA"),
                            inline: false
                        }
                    );
                    break;
                case "atc":
                    vatsimClient = vatsimClient as VatsimAtc;
                    const fullInfo = await this._vatsimManager.getInfo();
                    vatsimEmbed.addFields(
                        {
                            name: "Position",
                            value: fullInfo.facilities[vatsimClient.facility].long,
                            inline: true
                        },
                        {
                            name: "Frequency",
                            value: vatsimClient.frequency,
                            inline: true
                        },
                        {
                            name: "ATIS",
                            value: codeBlock(vatsimClient.text_atis?.join("\n") || "NA"),
                            inline: false
                        }
                    );
                    break;
            }
        } catch (error) {
            logger.error(`[${client.shard.ids}] ${error}`);
            vatsimEmbed.setColor("#ff0000").setDescription(`${interaction.member}, ${error.message}`);
        }

        return InteractionUtils.replyOrFollowUp(interaction, {
            embeds: [vatsimEmbed]
        });
    }
}
