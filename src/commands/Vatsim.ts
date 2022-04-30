import {Category, NotBot} from "@discordx/utilities";
import {AutocompleteInteraction, CommandInteraction, MessageEmbed} from "discord.js";
import {Client, Discord, Guard, Slash, SlashChoice, SlashOption} from "discordx";
import {injectable} from "tsyringe";

import {GuildOnly} from "../guards/GuildOnly.js";
import {RequiredBotPerms} from "../guards/RequiredBotPerms.js";
import {VatsimManager} from "../model/framework/manager/VatsimManager.js";
import type {VatsimAtc, VatsimAtis, VatsimPilot} from "../model/Typeings.js";
import logger from "../utils/LoggerFactory.js";
import {InteractionUtils, ObjectUtil} from "../utils/Utils.js";

@Discord()
@Category("VATSIM commands")
@injectable()
export class Vatsim {
    public constructor(private _ivaoManager: VatsimManager) {

    }

    @Slash("vatsim", {
        description: "Gives you the information for the chosen call sign on the VATSIM network"
    })
    @Guard(NotBot, RequiredBotPerms({
        textChannel: ["EMBED_LINKS"]
    }), GuildOnly)
    private vatsim(
        @SlashChoice("atc", "pilot")
        @SlashOption("type", {
            // TODO: fill this info out
            description: "Supply a description",
            type: "STRING",
            required: true
        })
            type: "atc" | "pilot",
        @SlashOption("call-sign", {
            description: "What call sign would you like the bot to give information for?",
            autocomplete: (interaction: AutocompleteInteraction) => InteractionUtils.search(interaction, VatsimManager),
            type: "STRING",
            required: true
        })
            callSign: string,
        interaction: CommandInteraction,
        client: Client
    ): Promise<void> {
        const vatsimEmbed = new MessageEmbed()
            .setTitle(`${callSign.toUpperCase()}`)
            .setColor("#0099ff")
            .setFooter({
                text: `${client.user.username} • This is not a source for official briefing • Please use the appropriate forums • Source: VATSIM API`
            })
            .setTimestamp();

        try {
            let vatsimClient = this._ivaoManager.getClientInfo(callSign, type) as VatsimPilot | VatsimAtc;
            vatsimEmbed.setTitle(`Vatsim : ${callSign}`);
            vatsimEmbed.addFields({
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
                });
            switch (type) {
                case "pilot":
                    vatsimClient = vatsimClient as VatsimPilot;
                    vatsimEmbed.addFields(
                        {
                            name: "Departure",
                            value: vatsimClient.flight_plan.departure,
                            inline: true
                        },
                        {
                            name: "Destination",
                            value: vatsimClient.flight_plan.arrival,
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
                            value: vatsimClient.flight_plan.cruise_tas,
                            inline: true
                        },
                        {
                            name: "Cruising Level",
                            value: vatsimClient.flight_plan.alternate,
                            inline: true
                        },
                        {
                            name: "Aircraft",
                            value: vatsimClient.flight_plan.aircraft,
                            inline: true
                        },
                        {
                            name: "Route",
                            value: vatsimClient.flight_plan.route,
                            inline: true
                        }
                    );
                    const depTime = vatsimClient.flight_plan.departure;
                    if (ObjectUtil.validString(depTime)) {
                        vatsimEmbed.addField("Departure Time", this.parseDepartureTime(vatsimClient), true);
                    }

                    const eet = vatsimClient.flight_plan.enroute_time;
                    if (ObjectUtil.validString(eet)) {
                        vatsimEmbed.addField("EET", this.parseEet(vatsimClient), true);
                    }
                    break;
                case "atc":
                    vatsimClient = vatsimClient as VatsimAtc;
                    vatsimEmbed.addFields(
                        {
                            name: "Position",
                            value: this._ivaoManager.info.facilities[vatsimClient.facility].long,
                            inline: true
                        },
                        {
                            name: "Frequency",
                            value: vatsimClient.frequency,
                            inline: true
                        },
                        {
                            name: "ATIS",
                            value: vatsimClient.text_atis.join("\n"),
                            inline: true
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

    @Slash("vatsim-online", {
        description: "Gives you the information for all ATCs which match the given partial callsign on the VATSIM network"
    })
    @Guard(NotBot, RequiredBotPerms({
        textChannel: ["EMBED_LINKS"]
    }), GuildOnly)
    private vatsimOnline(
        @SlashOption("partial-callsign", {
            description: "What partial call sign would you like the bot to give information for?",
            type: "STRING",
            required: true
        })
            partialCallSign: string,
        interaction: CommandInteraction,
        client: Client
    ): Promise<void> {
        const vatsimEmbed = new MessageEmbed()
            .setTitle(`${partialCallSign.toUpperCase()}`)
            .setColor("#0099ff")
            .setFooter({
                text: `${client.user.username} • This is not a source for official briefing • Please use the appropriate forums • Source: VATSIM API`
            })
            .setTimestamp();

        try {
            const atcList = this._ivaoManager.getPartialAtcClientInfo(partialCallSign) as VatsimAtis[];

            vatsimEmbed.setTitle(`VATSIM : ${partialCallSign}`);
            for (const atc of atcList) {
                vatsimEmbed.addField(`${atc.callsign}`, `CID: ${atc.cid}, Frequency: ${atc.frequency}`);
            }
        } catch (error) {
            logger.error(`[${client.shard.ids}] ${error}`);
            vatsimEmbed.setColor("#ff0000").setDescription(`${interaction.member}, ${error.message}`);
        }

        return InteractionUtils.replyOrFollowUp(interaction, {
            embeds: [vatsimEmbed]
        });
    }

    private parseDepartureTime(c: VatsimPilot): string | null {
        return c.flight_plan
            ? c.flight_plan.deptime.length === 2
                ? `00:${c.flight_plan.deptime.substring(0, 2)}z`
                : c.flight_plan.deptime.length === 3
                    ? `0${c.flight_plan.deptime.substring(0, 1)}:${c.flight_plan.deptime.substring(1, 3)}z`
                    : `${c.flight_plan.deptime.substring(0, 2)}:${c.flight_plan.deptime.substring(2, 4)}z`
            : null;
    }

    private parseEet(c: VatsimPilot): string | null {
        return c.flight_plan
            ? c.flight_plan.enroute_time.length === 2
                ? `00:${c.flight_plan.enroute_time.substring(0, 2)}`
                : c.flight_plan.enroute_time.length === 3
                    ? `0${c.flight_plan.enroute_time.substring(0, 1)}:${c.flight_plan.enroute_time.substring(1, 3)}`
                    : `${c.flight_plan.enroute_time.substring(0, 2)}:${c.flight_plan.enroute_time.substring(2, 4)}`
            : null;
    }
}