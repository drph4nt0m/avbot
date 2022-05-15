import { Category } from "@discordx/utilities";
import dayjs from "dayjs";
import timezone from "dayjs/plugin/timezone.js";
import utc from "dayjs/plugin/utc.js";
import type { CommandInteraction } from "discord.js";
import { AutocompleteInteraction, MessageEmbed } from "discord.js";
import { Client, Discord, Guard, Slash, SlashChoice, SlashOption } from "discordx";
import { injectable } from "tsyringe";

import { RequiredBotPerms } from "../guards/RequiredBotPerms.js";
import { AirportManager } from "../model/framework/manager/AirportManager.js";
import { AvwxManager } from "../model/framework/manager/AvwxManager.js";
import { GeonamesManager } from "../model/framework/manager/GeonamesManager.js";
import logger from "../utils/LoggerFactory.js";
import { InteractionUtils } from "../utils/Utils.js";

@Discord()
@Category("Miscellaneous")
@injectable()
export class Time {
    static {
        dayjs.extend(utc);
        dayjs.extend(timezone);
    }

    public constructor(private _avwxManager: AvwxManager, private _geonamesManager: GeonamesManager) {}

    @Slash("zulu", {
        description: "Get the current zulu time"
    })
    @Guard(
        RequiredBotPerms({
            textChannel: ["EMBED_LINKS"]
        })
    )
    public async zulu(interaction: CommandInteraction, client: Client): Promise<void> {
        await interaction.deferReply();
        const localEmbed = new MessageEmbed()
            .setTitle(`Current zulu time`)
            .setColor("#1a8fe3")
            .setDescription(dayjs().utc().format("HHmm[Z]"))
            .setFooter({
                text: `${client.user.username} • This is not a source for official briefing • Please use the appropriate forums`
            })
            .setTimestamp();

        return InteractionUtils.replyOrFollowUp(interaction, {
            embeds: [localEmbed]
        });
    }

    @Slash("time", {
        description: "Get the zulu to local or local to zulu time conversions for any chosen airport"
    })
    @Guard(
        RequiredBotPerms({
            textChannel: ["EMBED_LINKS"]
        })
    )
    public async time(
        @SlashChoice({ name: "Local to Zulu", value: "Zulu" })
        @SlashChoice({ name: "Zulu to Local", value: "Local" })
        @SlashOption("type", {
            description: "Convert time from what to what?",
            type: "STRING",
            required: true
        })
        type: "Zulu" | "Local",
        @SlashOption("icao", {
            autocomplete: (interaction: AutocompleteInteraction) => InteractionUtils.search(interaction, AirportManager),
            description: "Convert time for which ICAO?",
            type: "STRING",
            required: true
        })
        icao: string,
        @SlashOption("time", {
            description: 'Enter local or zulu time as defined by your previous choices ("HHmm" format)',
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
                timeString = dayjs().utc().hour(Number.parseInt(HH)).minute(Number.parseInt(MM)).tz(data.timezoneId).format("HHmm");
            } else {
                timeString = dayjs().utcOffset(data.gmtOffset).hour(Number.parseInt(HH)).minute(Number.parseInt(MM)).utc().format("HHmm");
            }
            const opposite = type === "Local" ? "Zulu" : "Local";
            const fromSuffix = type === "Local" ? "Z" : "hrs";
            const toSuffix = type === "Local" ? "hrs" : "Z";
            localEmbed.setTitle(`${type} time at ${icao} when ${opposite.toLowerCase()} time is ${time}${fromSuffix}`).setDescription(`${timeString}${toSuffix}`);
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
            throw new Error(`${type} time must be in HHmm format`);
        }
        const HH = time.slice(0, 2);
        const MM = time.slice(2);
        if (Number.isNaN(Number.parseInt(HH)) || Number.isNaN(Number.parseInt(MM))) {
            throw new Error("Invalid time, value must be a number");
        }
        if (Number.parseInt(HH) > 23 || Number.parseInt(HH) < 0) {
            throw new Error("Invalid hours");
        }
        if (Number.parseInt(MM) > 59 || Number.parseInt(MM) < 0) {
            throw new Error("Invalid minutes");
        }
    }
}
