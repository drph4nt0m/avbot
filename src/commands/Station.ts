import { Category } from "@discordx/utilities";
import type { CommandInteraction } from "discord.js";
import { AutocompleteInteraction, MessageEmbed } from "discord.js";
import { Client, Discord, Guard, Slash, SlashOption } from "discordx";
import accents from "remove-accents";
import { injectable } from "tsyringe";

import { RequiredBotPerms } from "../guards/RequiredBotPerms.js";
import { AirportManager } from "../model/framework/manager/AirportManager.js";
import { AvwxManager } from "../model/framework/manager/AvwxManager.js";
import type { Runway, Station } from "../model/Typeings.js";
import logger from "../utils/LoggerFactory.js";
import { InteractionUtils, ObjectUtil } from "../utils/Utils.js";

@Discord()
@Category("Miscellaneous")
@injectable()
export class IcaoStation {
    public constructor(private _avwxManager: AvwxManager) {}

    @Slash("station", {
        description: "Gives you the station information for the chosen airport"
    })
    @Guard(
        RequiredBotPerms({
            textChannel: ["EMBED_LINKS"]
        })
    )
    public async icaoStation(
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
            .setTitle(`Station info for ${icao.toUpperCase()}`)
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
                    value: station.runways ? this.getRunwaysStr(station.runways) : "Unknown",
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
        const stre = runways
            .map((rw) => {
                if (rw.length_ft !== 0 && rw.width_ft !== 0) {
                    return `${rw.ident1}-${rw.ident2} : Length - ${rw.length_ft} ft, Width - ${rw.width_ft} ft`;
                }
                return `${rw.ident1}-${rw.ident2} : Length - NA, Width - NA`;
            })
            .join("\n");
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
}
