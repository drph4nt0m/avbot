import dayjs, { Dayjs } from "dayjs";
import utc from "dayjs/plugin/utc.js";
import type { AutocompleteInteraction, BaseCommandInteraction, InteractionReplyOptions, MessageComponentInteraction, MessageEmbedOptions } from "discord.js";
import { MessageEmbed, WebhookClient } from "discord.js";
import type { Client } from "discordx";
import { container } from "tsyringe";
import type constructor from "tsyringe/dist/typings/types/constructor";

import TIME_UNIT from "../enums/TIME_UNIT.js";
import type { ISearchBase, SearchBase } from "../model/framework/ISearchBase.js";
import logger from "./LoggerFactory.js";

export class Utils {
    public static sleep(ms: number): Promise<void> {
        return new Promise((resolve) => {
            setTimeout(resolve, ms);
        });
    }
}

export class ObjectUtil {
    static {
        dayjs.extend(utc);
    }

    public static get dayJsAsUtc(): Dayjs {
        return dayjs();
    }

    /**
     * Ensures value(s) strings and has a size after trim
     * @param strings
     * @returns {boolean}
     */
    public static validString(...strings: Array<unknown>): boolean {
        if (strings.length === 0) {
            return false;
        }
        for (const currString of strings) {
            if (typeof currString !== "string") {
                return false;
            }
            if (currString.length === 0) {
                return false;
            }
            if (currString.trim().length === 0) {
                return false;
            }
        }
        return true;
    }

    /**
     * ensures value is an array and has at least 1 item in it
     * @param array
     * @returns {array is any[]}
     */
    public static isValidArray(array: any): array is any[] {
        return Array.isArray(array) && array.length > 0;
    }

    /**
     * Assert argument is an object, and it has more than one key
     * @param obj
     * @returns {obj is Record<string, any>}
     */
    public static isValidObject(obj: unknown): obj is Record<string, any> {
        return typeof obj === "object" && obj !== null && obj !== undefined && Object.keys(obj).length > 0;
    }

    public static convertToMilli(value: number, unit: TIME_UNIT): number {
        switch (unit) {
            case TIME_UNIT.seconds:
                return value * 1000;
            case TIME_UNIT.minutes:
                return value * 60000;
            case TIME_UNIT.hours:
                return value * 3600000;
            case TIME_UNIT.days:
                return value * 86400000;
            case TIME_UNIT.weeks:
                return value * 604800000;
            case TIME_UNIT.months:
                return value * 2629800000;
            case TIME_UNIT.years:
                return value * 31556952000;
            case TIME_UNIT.decades:
                return value * 315569520000;
        }
    }

    public static timeToHuman(value: number, timeUnit: TIME_UNIT = TIME_UNIT.milliseconds): string {
        let seconds: number;
        if (timeUnit === TIME_UNIT.milliseconds) {
            seconds = Math.round(value / 1000);
        } else if (timeUnit !== TIME_UNIT.seconds) {
            seconds = Math.round(ObjectUtil.convertToMilli(value, timeUnit) / 1000);
        } else {
            seconds = Math.round(value);
        }
        if (Number.isNaN(seconds)) {
            throw new Error("Unknown error");
        }
        const levels: [number, string][] = [
            [Math.floor(seconds / 31536000), "years"],
            [Math.floor((seconds % 31536000) / 86400), "days"],
            [Math.floor(((seconds % 31536000) % 86400) / 3600), "hours"],
            [Math.floor((((seconds % 31536000) % 86400) % 3600) / 60), "minutes"],
            [(((seconds % 31536000) % 86400) % 3600) % 60, "seconds"]
        ];
        let returnText = "";

        for (let i = 0, max = levels.length; i < max; i++) {
            if (levels[i][0] === 0) {
                continue;
            }
            returnText += ` ${levels[i][0]} ${levels[i][0] === 1 ? levels[i][1].substr(0, levels[i][1].length - 1) : levels[i][1]}`;
        }
        return returnText.trim();
    }
}

export class InteractionUtils {
    public static async replyOrFollowUp(interaction: BaseCommandInteraction | MessageComponentInteraction, replyOptions: (InteractionReplyOptions & { ephemeral?: boolean }) | string): Promise<void> {
        // if interaction is already replied
        if (interaction.replied) {
            await interaction.followUp(replyOptions);
            return;
        }

        // if interaction is deferred but not replied
        if (interaction.deferred) {
            await interaction.editReply(replyOptions);
            return;
        }

        // if interaction is not handled yet
        await interaction.reply(replyOptions);
    }

    public static async search<T extends ISearchBase<SearchBase>>(interaction: AutocompleteInteraction, contextHandler: constructor<T>): Promise<void> {
        const handler = container.resolve(contextHandler);
        const searchResults = await handler.search(interaction);
        if (ObjectUtil.isValidArray(searchResults)) {
            const responseMap = searchResults.map((searchResult) => {
                return {
                    name: searchResult.name,
                    value: searchResult.value
                };
            });
            return interaction.respond(responseMap);
        }
        return interaction.respond([]);
    }

    public static async sendWebhookMessage(webhookClient: WebhookClient, client: Client, embedOptions: MessageEmbedOptions): Promise<void> {
        try {
            const embed = new MessageEmbed({ timestamp: new Date(), ...embedOptions });
            await webhookClient.send({ embeds: [embed], username: client?.user?.username, avatarURL: client?.user?.avatarURL() });
        } catch (error) {
            logger.error(`Failed to send webhook message: "${JSON.stringify(embedOptions)}"`, error);
        }
    }
}
