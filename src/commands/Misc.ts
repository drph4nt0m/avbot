import {Category, RateLimit, TIME_UNIT} from "@discordx/utilities";
import type {CommandInteraction} from "discord.js";
import {AutocompleteInteraction, MessageEmbed} from "discord.js";
import {Client, Discord, Guard, Slash, SlashOption} from "discordx";
import accents from "remove-accents";
import {injectable} from "tsyringe";

import {GuildOnly} from "../guards/GuildOnly.js";
import {PremiumGuild} from "../guards/PremiumGuild.js";
import {RequiredBotPerms} from "../guards/RequiredBotPerms.js";
import {AeroDataBoxManager} from "../model/framework/manager/AeroDataBoxManager.js";
import {AirportDataManager} from "../model/framework/manager/AirportDataManager.js";
import {AirportManager} from "../model/framework/manager/AirportManager.js";
import {AviationStackManager} from "../model/framework/manager/AviationStackManager.js";
import {AvwxManager} from "../model/framework/manager/AvwxManager.js";
import {OpenSkyManager} from "../model/framework/manager/OpenSkyManager.js";
import type {Runway, Station} from "../model/Typeings.js";
import logger from "../utils/LoggerFactory.js";
import {InteractionUtils, ObjectUtil} from "../utils/Utils.js";

@Discord()
@Category("Miscellaneous commands")
@injectable()
export class Misc {

    public constructor(private _openSkyManager: OpenSkyManager,
                       private _aviationStackManager: AviationStackManager,
                       private _aeroDataBoxManager: AeroDataBoxManager,
                       private _airportDataManager: AirportDataManager,
                       private _airportManager: AirportManager,
                       private _avwxManager: AvwxManager) {
    }

    @Slash("icao", {
        description: "Gives you the station information for the chosen airport"
    })
    @Guard(RequiredBotPerms({
        textChannel: ["EMBED_LINKS"]
    }))
    private async icao(
        @SlashOption("icao", {
            autocomplete: (interaction: AutocompleteInteraction) => InteractionUtils.search(interaction, AirportManager),
            description: "What ICAO would you like the bot to give station information for?",
            type: "STRING",
            required: true
        })
            icao: string,
        interaction: CommandInteraction,
        client: Client
    ): Promise<void> {
        await interaction.deferReply();
        const stationEmbed = new MessageEmbed()
            .setTitle(`Station for ${icao.toUpperCase()}`)
            .setColor("#0099ff")
            .setFooter({
                text: `${client.user.username} • This is not a source for official briefing • Please use the appropriate forums • Source: AVWX`
            })
            .setTimestamp();
        try {
            const station = await this._avwxManager.getStation(icao);
            stationEmbed.addFields(
                {
                    name: "ICAO",
                    value: station.icao || "Unknown",
                    inline: true
                },
                {
                    name: "IATA",
                    value: station.iata || "Unknown",
                    inline: true
                },
                {
                    name: "Name",
                    value: station.name ? accents.remove(station.name) : "Unknown",
                    inline: true
                },
                {
                    name: "City",
                    value: station.city ? accents.remove(station.city) : "Unknown",
                    inline: true
                },
                {
                    name: "Country",
                    value: station.country ? accents.remove(station.country) : "Unknown",
                    inline: true
                },
                {
                    name: "Type",
                    value: station.type.split("_")[0] || "Unknown",
                    inline: true
                },
                {
                    name: "Latitude",
                    value: station.latitude.toString() || "Unknown",
                    inline: true
                },
                {
                    name: "Longitude",
                    value: station.longitude.toString() || "Unknown",
                    inline: true
                },
                {
                    name: "Elevation",
                    value: station.elevation_ft ? `${station.elevation_ft} ft` : "Unknown",
                    inline: true
                },
                {
                    name: "Runways",
                    value: this.getRunwaysStr(station.runways),
                    inline: false
                },
                {
                    name: "More Info",
                    value: this.getLinks(station),
                    inline: false
                }
            );
        } catch (error) {
            logger.error(`[${client.shard.ids}] ${error}`);
            stationEmbed.setColor("#ff0000").setDescription(`${interaction.member}, ${error.message}`);
        }

        return InteractionUtils.replyOrFollowUp(interaction, {
            embeds: [stationEmbed]
        });
    }

    private getRunwaysStr(runways: Runway[]): string {
        const stre = runways.map(rw => {
            if (rw.length_ft !== 0 && rw.width_ft !== 0) {
                return `${rw.ident1}-${rw.ident2} : Length - ${rw.length_ft} ft, Width - ${rw.width_ft} ft`;
            }
            return `${rw.ident1}-${rw.ident2} : Length - NA, Width - NA`;
        }).join("\n");
        return ObjectUtil.validString(stre) ? stre : "Unknown";
    }

    private getLinks(station: Station): string {
        let links = "";
        if (station.website) {
            links += `Official Website: ${station.website}`;
            if (station.wiki) {
                links += `\nWikipedia: ${station.wiki}`;
            }
        } else if (station.wiki) {
            links += `\nWikipedia: ${station.wiki}`;
        }
        return ObjectUtil.validString(links) ? links : "None";
    }

    @Slash("live", {
        description: "[premium] Gives you the information for the chosen call sign in real life"
    })
    @Guard(GuildOnly, PremiumGuild, RateLimit(TIME_UNIT.seconds, 90), RequiredBotPerms({
        textChannel: ["EMBED_LINKS"]
    }))
    private async live(
        @SlashOption("call-sign", {
            description: "What call sign would you like the bot to give information for?",
            required: true
        })
            callSign: string,
        interaction: CommandInteraction,
        client: Client
    ): Promise<void> {
        await interaction.deferReply();
        await interaction.channel.sendTyping();
        const liveEmbed = new MessageEmbed()
            .setTitle(`${callSign.toUpperCase()}`)
            .setColor("#0099ff")
            .setFooter({
                text: `${client.user.username} • This is not a source for official briefing • Please use the appropriate forums • Source: The OpenSky Network API | AviationStack | AeroDataBox | AirportData`
            })
            .setTimestamp();
        let icao24 = null;
        try {
            const flightInfo = await this._openSkyManager.getFlightInfo(callSign);
            icao24 = flightInfo.icao24;
            liveEmbed
                .setTitle(`${callSign.toUpperCase()} (Track on OpenSky Network)`)
                .setURL(`https://opensky-network.org/network/explorer?icao24=${icao24}&callsign=${callSign}`)
                .addFields([
                    {
                        name: "Callsign",
                        value: flightInfo.callsign,
                        inline: true
                    },
                    {
                        name: "Ground Speed",
                        value: flightInfo.velocity,
                        inline: true
                    },
                    {
                        name: "Heading",
                        value: flightInfo.true_track,
                        inline: true
                    },
                    {
                        name: "Altitude",
                        value: flightInfo.geo_altitude,
                        inline: true
                    },
                    {
                        name: "Climb Rate",
                        value: flightInfo.vertical_rate,
                        inline: true
                    },
                    {
                        name: "Squawk",
                        value: flightInfo.squawk,
                        inline: true
                    },
                    {
                        name: "Country of Origin",
                        value: flightInfo.origin_country,
                        inline: true
                    },
                    {
                        name: "ICAO Address",
                        value: flightInfo.icao24,
                        inline: true
                    }
                ]);
        } catch (error) {
            logger.error(`[${client.shard.ids}] ${error}`);
            liveEmbed.setColor("#ff0000").setDescription(`${interaction.member}, ${error.message}`);
            return InteractionUtils.replyOrFollowUp(interaction, {
                embeds: [liveEmbed]
            });
        }

        try {
            const flightInfo = await this._aviationStackManager.getFlightInfo(callSign);
            liveEmbed.addFields([
                {
                    name: "Departure",
                    value: flightInfo.departure
                        ? flightInfo.departure.icao + (flightInfo.departure.airport ? ` | ${flightInfo.departure.airport}` : "")
                        : "Unknown",
                    inline: true
                },
                {
                    name: "Arrival",
                    value: flightInfo.arrival.icao
                        ? flightInfo.arrival.icao + (flightInfo.arrival.airport ? ` | ${flightInfo.arrival.airport}` : "")
                        : "Unknown",
                    inline: true
                }
            ]);
        } catch (error) {
            logger.error(`[${client.shard.ids}] ${error}`);
        }

        try {
            const aircraftInfo = await this._aeroDataBoxManager.getAircraftInfo(icao24);

            liveEmbed.addFields([
                {
                    name: "Airline",
                    value: aircraftInfo.airlineName ? aircraftInfo.airlineName : "Unknown",
                    inline: true
                },
                {
                    name: "Aircraft",
                    value: aircraftInfo.typeName ? aircraftInfo.typeName : "Unknown",
                    inline: true
                },
                {
                    name: "Registration",
                    value: aircraftInfo.reg ? aircraftInfo.reg : "Unknown",
                    inline: true
                }
            ]);
        } catch (error) {
            logger.error(`[${client.shard.ids}] ${error}`);
        }

        try {
            const aircraftImage = await this._airportDataManager.getAircraftImage(icao24);

            liveEmbed.setImage(aircraftImage.image).addField("Image Credits", `[${aircraftImage.photographer}](${aircraftImage.link})`);
        } catch (error) {
            logger.error(`[${client.shard.ids}] ${error}`);
        }

        return InteractionUtils.replyOrFollowUp(interaction, {
            embeds: [liveEmbed]
        });
    }

}
