import type {
    AutocompleteInteraction,
    BaseCommandInteraction,
    MessageComponentInteraction,
    MessageOptions
} from "discord.js";
import {container} from "tsyringe";
import type constructor from "tsyringe/dist/typings/types/constructor";

import type {ISearchBase, SearchBase} from "../model/framework/ISearchBase.js";


export class Utils {
    public static sleep(ms: number): Promise<void> {
        return new Promise((resolve) => {
            setTimeout(resolve, ms);
        });
    }
}

export class ObjectUtil {

    /**
     * Ensures value is a string and has a size after trim
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

}

export class InteractionUtils {
    public static async replyOrFollowUp(
        interaction: BaseCommandInteraction | MessageComponentInteraction,
        replyOptions: (MessageOptions & { ephemeral?: boolean; }) | string
    ): Promise<void> {
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
            const responseMap = searchResults.map(searchResult => {
                return {
                    name: searchResult.item.name,
                    value: searchResult.item.value
                };
            });
            return interaction.respond(responseMap);
        }
        return interaction.respond([]);
    }
}
