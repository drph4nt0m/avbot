import { Category } from "@discordx/utilities";
import dayjs from "dayjs";
import timezone from "dayjs/plugin/timezone.js";
import utc from "dayjs/plugin/utc.js";
import type { CommandInteraction } from "discord.js";
import { ApplicationCommandOptionType, AutocompleteInteraction, inlineCode } from "discord.js";
import { Client, Discord, Guard, Slash, SlashChoice, SlashGroup, SlashOption } from "discordx";
import { injectable } from "tsyringe";

import { RequiredBotPerms } from "../guards/RequiredBotPerms.js";
import { AirportManager } from "../model/framework/manager/AirportManager.js";
import { AvwxManager } from "../model/framework/manager/AvwxManager.js";
import { GeonamesManager } from "../model/framework/manager/GeonamesManager.js";
import logger from "../utils/LoggerFactory.js";
import { InteractionUtils } from "../utils/Utils.js";
import { AvBotEmbedBuilder } from "../model/logic/AvBotEmbedBuilder.js";

@Discord()
@Category("Time")
@SlashGroup({
    name: "time",
    description: "Get the current zulu time or a conversion from zulu to local time or local time to zulu time for any airport"
})
@SlashGroup("time")
@injectable()
export class Time {
    static {
        dayjs.extend(utc);
        dayjs.extend(timezone);
    }

    public constructor(private _avwxManager: AvwxManager, private _geonamesManager: GeonamesManager) {}

    @Slash({
        description: "Get the current zulu time"
    })
    @Guard(
        RequiredBotPerms({
            textChannel: ["EmbedLinks"]
        })
    )
    public async zulu(interaction: CommandInteraction): Promise<void> {
        await interaction.deferReply();
        const localEmbed = new AvBotEmbedBuilder().setTitle(`Zulu time`).setColor("#0099ff").setDescription(dayjs().utc().format("HHmm[Z]")).setTimestamp();

        return InteractionUtils.replyOrFollowUp(interaction, {
            embeds: [localEmbed]
        });
    }

    @Slash({
        name: "convert",
        description: "Get the zulu to local or local to zulu time conversions for any chosen airport"
    })
    @Guard(
        RequiredBotPerms({
            textChannel: ["EmbedLinks"]
        })
    )
    public async time(
        @SlashChoice({ name: "Local to Zulu", value: "Zulu" })
        @SlashChoice({ name: "Zulu to Local", value: "Local" })
        @SlashOption({
            name: "type",
            description: "Convert time from what to what?",
            type: ApplicationCommandOptionType.String,
            required: true
        })
        type: "Zulu" | "Local",
        @SlashOption({
            name: "icao",
            autocomplete: (interaction: AutocompleteInteraction) => InteractionUtils.search(interaction, AirportManager),
            description: "Convert time for which ICAO?",
            type: ApplicationCommandOptionType.String,
            required: true
        })
        icao: string,
        @SlashOption({
            name: "time",
            description: 'Enter local or zulu time as defined by your previous choices ("HHmm" format)',
            required: true,
            type: ApplicationCommandOptionType.String
        })
        time: string,
        interaction: CommandInteraction,
        client: Client
    ): Promise<void> {
        await interaction.deferReply();

        const opposite = type === "Local" ? "Zulu" : "Local";
        const fromSuffix = type === "Local" ? "Z" : "hrs";
        const toSuffix = type === "Local" ? "hrs" : "Z";

        const localEmbed = new AvBotEmbedBuilder().setTitle(`${type} Time`).setColor("#0099ff").setTimestamp();
        try {
            this.validateTime(time, opposite);
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
            localEmbed.setTitle(`${type} time at ${inlineCode(icao)} when ${opposite.toLowerCase()} time is ${inlineCode(`${time}${fromSuffix}`)}`).setDescription(`${timeString}${toSuffix}`);
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
            throw new Error(`${type.toLowerCase()} time must be in HHmm format`);
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
