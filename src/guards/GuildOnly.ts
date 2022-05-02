import type { CommandInteraction } from "discord.js";
import type { Client, Next } from "discordx";

/**
 * Prevent the command from running on DM
 * @param {CommandInteraction} arg
 * @param {Client} client
 * @param {Next} next
 * @constructor
 */
export function GuildOnly(arg: CommandInteraction, client: Client, next: Next): Promise<unknown> {
    if (arg.inGuild()) {
        return next();
    }
}
