import { ICategory, NotBot } from "@discordx/utilities";
import { ActionRowBuilder, CommandInteraction, EmbedBuilder, Formatters, InteractionResponse, SelectMenuBuilder, SelectMenuComponentOptionData, SelectMenuInteraction } from "discord.js";
import { Client, DApplicationCommand, Discord, Guard, MetadataStorage, SelectMenuComponent, Slash } from "discordx";

import { GuildOnly } from "../guards/GuildOnly.js";
import { InteractionUtils, ObjectUtil } from "../utils/Utils.js";

type CatCommand = DApplicationCommand & ICategory;

@Discord()
export class Help {
    private readonly _catMap: Map<string, CatCommand[]> = new Map();

    public constructor() {
        const commands: CatCommand[] = MetadataStorage.instance.applicationCommandSlashesFlat as CatCommand[];
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
    public help(interaction: CommandInteraction, client: Client): Promise<void> {
        const embed = this.displayCategory(client);
        const selectMenu = this.getSelectDropdown();
        return InteractionUtils.replyOrFollowUp(interaction, {
            embeds: [embed],
            components: [selectMenu]
        });
    }

    private displayCategory(client: Client, category = "categories", pageNumber = 0): EmbedBuilder {
        if (category === "categories") {
            const embed = new EmbedBuilder()
                .setTitle(`${client.user.username} commands`)
                .setColor("#0099ff")
                .setDescription(`The items shown below are all the commands supported by this bot`)
                .setFooter({
                    text: `${client.user.username}`
                })
                .setTimestamp();
            for (const [cat] of this._catMap) {
                const description = `${cat} Commands`;
                embed.addFields([
                    {
                        name: "cat",
                        value: description
                    }
                ]);
            }
            return embed;
        }

        const commands = this._catMap.get(category);
        const chunks = this.chunk(commands, 24);
        const maxPage = chunks.length;
        const resultOfPage = chunks[pageNumber];
        const embed = new EmbedBuilder()
            .setTitle(`${category} Commands:`)
            .setColor("#0099ff")
            .setFooter({
                text: `${client.user.username} • Page ${pageNumber + 1} of ${maxPage}`
            })
            .setTimestamp();
        if (!resultOfPage) {
            return embed;
        }
        for (const item of resultOfPage) {
            const { description } = item;
            let fieldValue = "No description";
            if (ObjectUtil.validString(description)) {
                fieldValue = description;
            }

            const name = ObjectUtil.validString(item.group) ? `/${item.group} ${item.name}` : `/${item.name}`;
            const nameToDisplay = Formatters.inlineCode(name);
            embed.addFields([
                {
                    name: nameToDisplay,
                    value: fieldValue,
                    inline: resultOfPage.length > 5
                }
            ]);
        }
        return embed;
    }

    private getSelectDropdown(defaultValue = "categories"): ActionRowBuilder<SelectMenuBuilder> {
        const optionsForEmbed: SelectMenuComponentOptionData[] = [];
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
        const selectMenu = new SelectMenuBuilder().addOptions(optionsForEmbed).setCustomId("help-category-selector");
        return new ActionRowBuilder<SelectMenuBuilder>().addComponents(selectMenu);
    }

    @SelectMenuComponent("help-category-selector")
    private async selectCategory(interaction: SelectMenuInteraction, client: Client): Promise<InteractionResponse> {
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
