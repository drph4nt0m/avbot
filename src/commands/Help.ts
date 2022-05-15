import { ICategory, NotBot } from "@discordx/utilities";
import { CommandInteraction, MessageActionRow, MessageEmbed, MessageSelectMenu, MessageSelectOptionData, SelectMenuInteraction } from "discord.js";
import { Client, DApplicationCommand, Discord, Guard, MetadataStorage, SelectMenuComponent, Slash } from "discordx";

import { GuildOnly } from "../guards/GuildOnly.js";
import { InteractionUtils, ObjectUtil } from "../utils/Utils.js";

type CatCommand = DApplicationCommand & ICategory;

@Discord()
export class Help {
    private readonly _catMap: Map<string, CatCommand[]> = new Map();

    public constructor() {
        const commands: CatCommand[] = MetadataStorage.instance.applicationCommands as CatCommand[];
        for (const command of commands) {
            const { category } = command;
            if (!ObjectUtil.validString(category)) {
                continue;
            }
            if (this._catMap.has(category)) {
                this._catMap.get(category).push(command);
            } else {
                this._catMap.set(category, [command]);
            }
        }
    }

    @Slash("help", {
        description: "Get the description of all commands"
    })
    @Guard(NotBot, GuildOnly)
    private help(interaction: CommandInteraction, client: Client): Promise<void> {
        const embed = this.displayCategory(client);
        const selectMenu = this.getSelectDropdown();
        return InteractionUtils.replyOrFollowUp(interaction, {
            content: "Select a category",
            embeds: [embed],
            components: [selectMenu]
        });
    }

    private displayCategory(client: Client, category = "categories", pageNumber = 0): MessageEmbed {
        const botImage = client.user.displayAvatarURL({ dynamic: true });
        if (category === "categories") {
            const embed = new MessageEmbed()
                .setTitle(`${client.user.username} commands`)
                .setDescription(`The items shown below are all the commands supported by this bot`)
                .setAuthor({
                    name: `${client.user.username}`,
                    iconURL: botImage
                })
                .setTimestamp();
            for (const [cat] of this._catMap) {
                const description = `${cat} Commands`;
                embed.addField(cat, description);
            }
            return embed;
        }

        const commands = this._catMap.get(category);
        const chunks = this.chunk(commands, 24);
        const maxPage = chunks.length;
        const resultOfPage = chunks[pageNumber];
        const embed = new MessageEmbed();
        embed.setFooter({
            text: `Page ${pageNumber + 1} of ${maxPage}`
        });
        embed.addField("Commands:", "\u200b");
        if (!resultOfPage) {
            return embed;
        }
        for (const item of resultOfPage) {
            const { description } = item;
            let fieldValue = "No description";
            if (ObjectUtil.validString(description)) {
                fieldValue = description;
            }
            const nameToDisplay = `/${item.name}`;
            embed.addField(nameToDisplay, fieldValue, resultOfPage.length > 5);
        }
        return embed;
    }

    private getSelectDropdown(defaultValue = "categories"): MessageActionRow {
        const optionsForEmbed: MessageSelectOptionData[] = [];
        optionsForEmbed.push({
            description: "View all categories",
            label: "Categories",
            value: "categories",
            default: defaultValue === "categories"
        });
        for (const [cat] of this._catMap) {
            const description = `${cat} Commands`;
            optionsForEmbed.push({
                description,
                label: cat,
                value: cat,
                default: defaultValue === cat
            });
        }
        const selectMenu = new MessageSelectMenu().addOptions(optionsForEmbed).setCustomId("help-category-selector");
        return new MessageActionRow().addComponents(selectMenu);
    }

    @SelectMenuComponent("help-category-selector")
    private async selectCategory(interaction: SelectMenuInteraction, client: Client): Promise<void> {
        const catToShow = interaction.values[0];
        const categoryEmbed = await this.displayCategory(client, catToShow);
        const selectMenu = await this.getSelectDropdown(catToShow);
        return interaction.update({
            embeds: [categoryEmbed],
            components: [selectMenu]
        });
    }

    private chunk<T>(array: T[], chunkSize: number): T[][] {
        const r: T[][] = [];
        for (let i = 0; i < array.length; i += chunkSize) {
            r.push(array.slice(i, i + chunkSize));
        }
        return r;
    }
}
