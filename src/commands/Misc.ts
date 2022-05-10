import { Category, RateLimit, TIME_UNIT } from "@discordx/utilities";
import dayjs from "dayjs";
import timezone from "dayjs/plugin/timezone.js";
import utc from "dayjs/plugin/utc.js";
import type { CommandInteraction } from "discord.js";
import { AutocompleteInteraction, MessageEmbed } from "discord.js";
import { Client, Discord, Guard, Slash, SlashChoice, SlashOption } from "discordx";
import { injectable } from "tsyringe";

import { GuildOnly } from "../guards/GuildOnly.js";
import { PremiumGuild } from "../guards/PremiumGuild.js";
import { RequiredBotPerms } from "../guards/RequiredBotPerms.js";
import { AeroDataBoxManager } from "../model/framework/manager/AeroDataBoxManager.js";
import { AirportDataManager } from "../model/framework/manager/AirportDataManager.js";
import { AirportManager } from "../model/framework/manager/AirportManager.js";
import { AviationStackManager } from "../model/framework/manager/AviationStackManager.js";
import { AvwxManager } from "../model/framework/manager/AvwxManager.js";
import { GeonamesManager } from "../model/framework/manager/GeonamesManager.js";
import { OpenSkyManager } from "../model/framework/manager/OpenSkyManager.js";
import logger from "../utils/LoggerFactory.js";
import { InteractionUtils } from "../utils/Utils.js";

@Discord()
@Category("Miscellaneous")
@injectable()
export class Misc {
    static {
        dayjs.extend(utc);
        dayjs.extend(timezone);
    }

    public constructor(
        private _openSkyManager: OpenSkyManager,
        private _aviationStackManager: AviationStackManager,
        private _aeroDataBoxManager: AeroDataBoxManager,
        private _airportDataManager: AirportDataManager,
        private _airportManager: AirportManager,
        private _avwxManager: AvwxManager,
        private _geonamesManager: GeonamesManager
    ) {}

    @Slash("live", {
        description: "[premium] Gives you the information for the chosen call sign in real life"
    })
    @Guard(
        GuildOnly,
        PremiumGuild,
        RateLimit(TIME_UNIT.seconds, 90),
        RequiredBotPerms({
            textChannel: ["EMBED_LINKS"]
        })
    )
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

            liveEmbed.setImage(aircraftImage.image).addField("Image Credits", `[${aircraftImage.photographer}](${aircraftImage.link})`);
        } catch (error) {
            logger.error(`[${client.shard.ids}] ${error}`);
        }

        return InteractionUtils.replyOrFollowUp(interaction, {
            embeds: [liveEmbed]
        });
    }

    @Slash("time", {
        description: "Get the current zulu time or specific zulu or local time for the given local or zulu Time and ICAO"
    })
    @Guard(
        RequiredBotPerms({
            textChannel: ["EMBED_LINKS"]
        })
    )
    private async time(
        @SlashOption("icao", {
            autocomplete: (interaction: AutocompleteInteraction) => InteractionUtils.search(interaction, AirportManager),
            description: "Enter ICAO code",
            type: "STRING",
            required: true
        })
        icao: string,
        @SlashChoice("Zulu", "Local")
        @SlashOption("type", {
            description: "Do you want to get the local time from zulu or zulu from local?",
            type: "STRING",
            required: true
        })
        type: "Zulu" | "Local",
        @SlashOption("time-value", {
            description: "Enter local or zulu time as defined by your previous choice",
            type: "STRING",
            required: true
        })
        time: string,
        interaction: CommandInteraction,
        client: Client
    ): Promise<void> {
        await interaction.deferReply();
        const localEmbed = new MessageEmbed()
            .setTitle(`${type} Time`)
            .setColor("#1a8fe3")
            .setFooter({
                text: `${client.user.username} • This is not a source for official briefing • Please use the appropriate forums`
            })
            .setTimestamp();
        try {
            this.validateTime(time, type);
        } catch (e) {
            logger.error(`[${client.shard.ids}] ${e.message}`);
            localEmbed.setColor("#ff0000").setDescription(`${interaction.member}, ${e.message}`);
            return InteractionUtils.replyOrFollowUp(interaction, {
                embeds: [localEmbed]
            });
        }
        try {
            const stationInfo = await this._avwxManager.getStation(icao);
            let timeString: string;
            const data = await this._geonamesManager.getTimezone(stationInfo.latitude.toString(), stationInfo.longitude.toString());
            const [HH, MM] = [time.slice(0, 2), time.slice(2)];
            if (type === "Local") {
                timeString = dayjs().utc().hour(Number.parseInt(HH)).minute(Number.parseInt(MM)).tz(data.timezoneId).format("DD/MM HHmm");
            } else {
                timeString = dayjs().utcOffset(data.gmtOffset).hour(Number.parseInt(HH)).minute(Number.parseInt(MM)).utc().format("DD/MM HHmm");
            }
            const opposite = type === "Local" ? "Zulu" : "Local";
            localEmbed.setTitle(`${type} Time at ${icao} when ${opposite} time is ${time}hrs`).setDescription(`${timeString}hrs`);
        } catch (error) {
            logger.error(`[${client.shard.ids}] ${error}`);
            localEmbed.setColor("#ff0000").setDescription(`${interaction.member}, ${error.message}`);
        }

        return InteractionUtils.replyOrFollowUp(interaction, {
            embeds: [localEmbed]
        });
    }

    private validateTime(time: string, type: "Zulu" | "Local"): void {
        if (time.length !== 4) {
            throw new Error(`${type} time must be in HHMM format`);
        }
        const HH = time.slice(0, 2);
        const MM = time.slice(2);
        if (Number.isNaN(Number.parseInt(HH)) || Number.isNaN(Number.parseInt(HH))) {
            throw new Error("Invalid time, value must be a number");
        }
        if (Number.parseInt(HH) > 23 || Number.parseInt(HH) < 0) {
            throw new Error("Invalid HH");
        }
        if (Number.parseInt(MM) > 59 || Number.parseInt(MM) < 0) {
            throw new Error("Invalid MM");
        }
    }
}
