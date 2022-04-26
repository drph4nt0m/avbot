import {Category, NotBot} from "@discordx/utilities";
import {CommandInteraction, MessageEmbed} from "discord.js";
import {Client, Discord, Guard, Slash, SlashChoice, SlashOption} from "discordx";
import {injectable} from "tsyringe";

import {GuildOnly} from "../guards/GuildOnly.js";
import {RequiredBotPerms} from "../guards/RequiredBotPerms.js";
import {IvaoManager} from "../model/framework/manager/IvaoManager.js";
import {IvaoPilot} from "../model/Typeings.js";

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
    private async atisVoice(
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
            let ivaoClient = await this._ivaoManager.getClientInfo(callSign, type);
            ivaoEmbed.setTitle(`IVAO : ${callSign} (open on Webeye)`).setURL(`https://webeye.ivao.aero/?callsign=${ivaoClient.callsign}`);
            switch (type) {
                case "pilot":
                    ivaoClient = ivaoClient as IvaoPilot;
                    ivaoEmbed.addFields(
                        {
                            name: "Call Sign",
                            value: ivaoClient.callsign,
                            inline: true
                        },
                        {
                            name: "VID",
                            value: ivaoClient.vid,
                            inline: true
                        },
                        {
                            name: "Rating",
                            value: ivaoClient.atcPilotRating,
                            inline: true
                        },
                        {
                            name: "Departure",
                            value: ivaoClient.flightPlan.departureAerodrome,
                            inline: true
                        },
                        {
                            name: "Destination",
                            value: ivaoClient.destinationAerodrome,
                            inline: true
                        },
                        {
                            name: "Transponder",
                            value: ivaoClient.transponderCode,
                            inline: true
                        },
                        {
                            name: "Latitude",
                            value: ivaoClient.latitude,
                            inline: true
                        },
                        {
                            name: "Longitude",
                            value: ivaoClient.longitude,
                            inline: true
                        },
                        {
                            name: "Altitude",
                            value: ivaoClient.altitude,
                            inline: true
                        },
                        {
                            name: "Ground Speed",
                            value: ivaoClient.groundSpeed,
                            inline: true
                        },
                        {
                            name: "Cruising Speed",
                            value: ivaoClient.cruisingSpeed,
                            inline: true
                        },
                        {
                            name: "Cruising Level",
                            value: ivaoClient.cruisingLevel,
                            inline: true
                        },
                        {
                            name: "Departure Time",
                            value: ivaoClient.departureTime,
                            inline: true
                        },
                        {
                            name: "EET",
                            value: `${ivaoClient.eetHours}:${ivaoClient.eetMinutes}`,
                            inline: true
                        },
                        {
                            name: "Aircraft",
                            value: ivaoClient.aircraft.split("/")[1],
                            inline: true
                        },
                        {
                            name: "Route",
                            value: ivaoClient.route,
                            inline: true
                        }
                    );
                    break;
                case "atc":
                    break;
            }
        } catch (e) {

        }
    }
}
