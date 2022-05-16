import type { CommandInteraction } from "discord.js";
import { MessageEmbed } from "discord.js";
import type { Client, Next } from "discordx";
import { container } from "tsyringe";

import { Mongo } from "../model/db/Mongo.js";
import { PropertyResolutionManager } from "../model/framework/manager/PropertyResolutionManager.js";
import logger from "../utils/LoggerFactory.js";
import { InteractionUtils } from "../utils/Utils.js";

const mongo = container.resolve(Mongo);
const propertyResolutionManager = container.resolve(PropertyResolutionManager);

/**
 * Guard that will only pass when the guild is a premium guild
 * @param {CommandInteraction} arg
 * @param {Client} client
 * @param {Next} next
 * @constructor
 */
export async function PremiumGuild(arg: CommandInteraction, client: Client, next: Next): Promise<unknown> {
    const guildId = arg.guildId;
    const isPremium = await mongo.isPremiumGuild(guildId);
    const member = arg.member;
    if (!isPremium) {
        logger.error(`[${client.shard.ids}] ${guildId} tried using ${arg.commandName} command`);
        try {
            const inviteUrl = propertyResolutionManager.getProperty("SUPPORT_SERVER_INVITE");
            const premiumEmbed = new MessageEmbed()
                .setTimestamp()
                .setColor("#00ff00")
                .setDescription(
                    `${member}, this command is only available for premium servers. If you want to join the premium program, join [AvBot Support Server](${inviteUrl}) and contact the developer.`
                )
                .setFooter({
                    text: `${client.user.username} • @dr_ph4nt0m#8402`
                });
            return InteractionUtils.replyOrFollowUp(arg, {
                embeds: [premiumEmbed]
            });
        } catch {
            // it failed, for some reason, to send the embed, but we still don't want to continue, just let the interaction fail
        }
        return;
    }
    return next();
}
