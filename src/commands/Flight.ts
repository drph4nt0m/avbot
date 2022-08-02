import { Category, RateLimit, TIME_UNIT } from "@discordx/utilities";
import type { CommandInteraction } from "discord.js";
import { EmbedBuilder, inlineCode } from "discord.js";
import { Client, Discord, Guard, Slash, SlashOption } from "discordx";
import { injectable } from "tsyringe";

import { GuildOnly } from "../guards/GuildOnly.js";
import { PremiumGuild } from "../guards/PremiumGuild.js";
import { RequiredBotPerms } from "../guards/RequiredBotPerms.js";
import { AeroDataBoxManager } from "../model/framework/manager/AeroDataBoxManager.js";
import { AirportDataManager } from "../model/framework/manager/AirportDataManager.js";
import { AviationStackManager } from "../model/framework/manager/AviationStackManager.js";
import { OpenSkyManager } from "../model/framework/manager/OpenSkyManager.js";
import logger from "../utils/LoggerFactory.js";
import { InteractionUtils, ObjectUtil } from "../utils/Utils.js";

@Discord()
@Category("IRL Aviation")
@injectable()
export class Flight {
    public constructor(
        private _openSkyManager: OpenSkyManager,
        private _aviationStackManager: AviationStackManager,
        private _aeroDataBoxManager: AeroDataBoxManager,
        private _airportDataManager: AirportDataManager
    ) {}

    @Slash("flight", {
        description: "[PREMIUM] Gives you the information for the chosen call sign of the real life flight"
    })
    @Guard(
        GuildOnly,
        PremiumGuild,
        RateLimit(TIME_UNIT.seconds, 90, {
            message: `Your command is being rate limited! Try again after {until}.`,
            ephemeral: true
        }),
        RequiredBotPerms({
            textChannel: ["EmbedLinks"]
        })
    )
    public async flight(
        @SlashOption("call-sign", {
            description: "What call sign would you like the bot to give information for?",
            required: true
        })
        callSign: string,
        interaction: CommandInteraction,
        client: Client
    ): Promise<void> {
        await interaction.deferReply();
        callSign = callSign.toUpperCase();

        const liveEmbed = new EmbedBuilder()
            .setTitle(`Flight: ${inlineCode(callSign)}`)
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
                .setTitle(`Flight: ${inlineCode(callSign)} (Track on OpenSky Network)`)
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
                    value: flightInfo.departure ? flightInfo.departure.icao + (flightInfo.departure.airport ? ` | ${flightInfo.departure.airport}` : "") : "Unknown",
                    inline: true
                },
                {
                    name: "Arrival",
                    value: flightInfo.arrival.icao ? flightInfo.arrival.icao + (flightInfo.arrival.airport ? ` | ${flightInfo.arrival.airport}` : "") : "Unknown",
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

            liveEmbed.setImage(aircraftImage.image).addFields(ObjectUtil.singleFieldBuilder("Image Credits", `[${aircraftImage.photographer}](${aircraftImage.link})`));
        } catch (error) {
            logger.error(`[${client.shard.ids}] ${error}`);
        }

        return InteractionUtils.replyOrFollowUp(interaction, {
            embeds: [liveEmbed]
        });
    }
}
