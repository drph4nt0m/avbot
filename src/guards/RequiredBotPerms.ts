import type {PermissionsType} from "@discordx/utilities";
import type {CommandInteraction} from "discord.js";
import {TextChannel} from "discord.js";
import type {Client, GuardFunction, Next} from "discordx";

import {InteractionUtils} from "../utils/Utils.js";

/**
 * THis ensures the bot has the required permissions to execute the command
 * @param {PermissionsType} permissions
 * @returns {GuardFunction<CommandInteraction>}
 * @constructor
 */
export function RequiredBotPerms(permissions: PermissionsType): GuardFunction<CommandInteraction> {
    return async function (arg: CommandInteraction, client: Client, next: Next) {
        const channel = arg.channel;
        if (!arg.inGuild() || !channel.isText() || !(channel instanceof TextChannel)) {
            return next();
        }
        const guild = arg.guild;
        const perms = typeof permissions === "function" ? await permissions(arg) : permissions;
        if (!channel.permissionsFor(guild.me).has(perms)) {
            return InteractionUtils.replyOrFollowUp(arg, `AvBot doesn't have permissions to send Embeds in this channel. Please enable "${perms.join(", ")}" under channel permissions for AvBot`);
        }
        return next();
    };
}
