import {Category, NotBot} from "@discordx/utilities";
import {AutocompleteInteraction, CommandInteraction, MessageEmbed} from "discord.js";
import {Client, Discord, Guard, Slash, SlashChoice, SlashOption} from "discordx";
import {injectable} from "tsyringe";

import {GuildOnly} from "../guards/GuildOnly.js";
import {RequiredBotPerms} from "../guards/RequiredBotPerms.js";
import {IvaoManager} from "../model/framework/manager/IvaoManager.js";
import type {IvaoAtc, IvaoPilot} from "../model/Typeings.js";
import logger from "../utils/LoggerFactory.js";
import {InteractionUtils, ObjectUtil} from "../utils/Utils.js";
import {IvaoAtcRatingEnum, IvaoPilotRatingEnum} from "../model/Typeings.js";

@Discord()
@Category("IVAO commands")
@injectable()
export class Ivao {

    public constructor(private _ivaoManager: IvaoManager) {

    }

    @Slash("ivao", {
        description: "Gives you the information for the chosen call sign on the IVAO network"
    })
    @Guard(NotBot, RequiredBotPerms({
        textChannel: ["EMBED_LINKS"]
    }), GuildOnly)
    private atisVoice(
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
            autocomplete: (interaction: AutocompleteInteraction) => InteractionUtils.search(interaction, IvaoManager),
            type: "STRING",
            required: true
        })
            callSign: string,
        interaction: CommandInteraction,
        client: Client
    ): Promise<void> {
        const ivaoEmbed = new MessageEmbed()
            .setTitle(`${callSign.toUpperCase()}`)
            .setColor("#0099ff")
            .setFooter({
                text: `${client.user.username} • This is not a source for official briefing • Please use the appropriate forums • Source: IVAO API`
            })
            .setTimestamp();

        try {
            let ivaoClient = this._ivaoManager.getClientInfo(callSign, type) as IvaoPilot | IvaoAtc;
            ivaoEmbed.setTitle(`IVAO : ${callSign} (open on Webeye)`);
            switch (type) {
                case "pilot":
                    ivaoClient = ivaoClient as IvaoPilot;
                    ivaoEmbed.setURL(`https://webeye.ivao.aero/?pilotId=${ivaoClient.id}`);
                    ivaoEmbed.addFields(
                        {
                            name: "Call Sign",
                            value: ivaoClient.callsign,
                            inline: true
                        },
                        {
                            name: "VID",
                            value: ivaoClient.userId.toString(),
                            inline: true
                        },
                        {
                            name: "Rating",
                            value: IvaoPilotRatingEnum[ivaoClient.rating.toString()],
                            inline: true
                        },
                        {
                            name: "Departure",
                            value: ivaoClient.flightPlan.departureId,
                            inline: true
                        },
                        {
                            name: "Destination",
                            value: ivaoClient.flightPlan.arrivalId,
                            inline: true
                        },
                        {
                            name: "Transponder",
                            value: ivaoClient.lastTrack.transponder.toString(),
                            inline: true
                        },
                        {
                            name: "Latitude",
                            value: ivaoClient.lastTrack.latitude.toString(),
                            inline: true
                        },
                        {
                            name: "Longitude",
                            value: ivaoClient.lastTrack.longitude.toString(),
                            inline: true
                        },
                        {
                            name: "Altitude",
                            value: `${ivaoClient.lastTrack.altitude.toString()} ft`,
                            inline: true
                        },
                        {
                            name: "Ground Speed",
                            value: `${ivaoClient.lastTrack.groundSpeed.toString()} knots`,
                            inline: true
                        },
                        {
                            name: "Cruising Speed",
                            value: ivaoClient.flightPlan.speed.toString(),
                            inline: true
                        },
                        {
                            name: "Cruising Level",
                            value: ivaoClient.flightPlan.level,
                            inline: true
                        },
                        {
                            name: "Departure Time",
                            value: this.parseTime(ivaoClient.flightPlan.departureTime),
                            inline: true
                        },
                        {
                            name: "EET",
                            value: this.parseTime(ivaoClient.flightPlan.eet),
                            inline: true
                        },
                        {
                            name: "Aircraft",
                            value: ivaoClient.flightPlan.aircraftId,
                            inline: true
                        },
                        {
                            name: "Route",
                            value: "```" + ivaoClient.flightPlan.route + "```",
                            inline: false
                        }
                    );
                    break;
                case "atc":
                    ivaoClient = ivaoClient as IvaoAtc;
                    ivaoEmbed.setURL(`https://webeye.ivao.aero/?atcId=${ivaoClient.id}`);
                    ivaoEmbed.addFields(
                        {
                            name: "Call Sign",
                            value: ivaoClient.callsign,
                            inline: true
                        },
                        {
                            name: "VID",
                            value: ivaoClient.userId.toString(),
                            inline: true
                        },
                        {
                            name: "Rating",
                            value: IvaoAtcRatingEnum[ivaoClient.rating.toString()],
                            inline: true
                        },
                        {
                            name: "Position",
                            value: ivaoClient.atcSession.position,
                            inline: true
                        },
                        {
                            name: "Frequency",
                            value: ivaoClient.atcSession.frequency.toString(),
                            inline: true
                        },
                        {
                            name: "ATIS Revision",
                            value: ivaoClient.atis.revision,
                            inline: true
                        },
                        {
                            name: "ATIS",
                            value: "```" + ivaoClient.atis.lines.join("\n") + "```",
                            inline: false
                        }
                    );
                    break;
            }
        } catch (e) {
            logger.error(`[${client.shard.ids}] ${e}`);
            ivaoEmbed.setColor("#ff0000").setDescription(`${interaction.member}, ${e.message}`);
        }
        return InteractionUtils.replyOrFollowUp(interaction, {
            embeds: [ivaoEmbed]
        });
    }

    @Slash("ivao-online", {
        description: "Gives you the information for all ATCs which match the given partial callsign on the IVAO network"
    })
    @Guard(NotBot, RequiredBotPerms({
        textChannel: ["EMBED_LINKS"]
    }), GuildOnly)
    private ivaoOnline(
        @SlashOption("partial-callsign", {
            description: "What partial callsign would you like the bot to give information for?",
            type: "STRING",
            required: true
        })
            partialCallSign: string,
        interaction: CommandInteraction,
        client: Client
    ): Promise<void> {
        const ivaoEmbed = new MessageEmbed()
            .setTitle(`${partialCallSign.toUpperCase()}`)
            .setColor("#0099ff")
            .setFooter({
                text: `${client.user.username} • This is not a source for official briefing • Please use the appropriate forums • Source: IVAO API`
            })
            .setTimestamp();

        try {
            const atcList = this._ivaoManager.getPartialAtcClientInfo(partialCallSign) as IvaoAtc[];

            ivaoEmbed.setTitle(`IVAO : ${partialCallSign}`);

            for (const atc of atcList) {
                ivaoEmbed.addField(`${atc.callsign}`, `VID: ${atc.userId}, Frequency: ${atc.atcSession.frequency}`);
            }

        } catch (error) {
            logger.error(`[${client.shard.ids}] ${error}`);
            ivaoEmbed.setColor("#ff0000").setDescription(`${interaction.member}, ${error.message}`);
        }
        return InteractionUtils.replyOrFollowUp(interaction, {
            embeds: [ivaoEmbed]
        });
    }

    private parseTime(time: number): string {
        return ObjectUtil.dayJs.utc().startOf("day").add(time, "seconds").format("HH:mm Z");
    }
}
