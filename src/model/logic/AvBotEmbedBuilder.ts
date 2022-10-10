import { EmbedBuilder, EmbedFooterOptions } from "discord.js";
import { ObjectUtil } from "../../utils/Utils.js";
import { container } from "tsyringe";
import { Client } from "discordx";

/**
 * custom builder will automatically call set footer with options passed in
 */
export class AvBotEmbedBuilder extends EmbedBuilder {
    private readonly _sources: string[];
    private readonly _client: Client;

    public constructor(...sources: string[]) {
        super();
        this._sources = sources;
        this._client = container.resolve(Client);
        this.setFooter(null);
    }

    /**
     * add additional sources, will automatically update the footer
     * @param {string} sources
     * @returns {this}
     */
    public addSources(...sources: string[]): this {
        this._sources.push(...sources);
        return this.setFooter(null);
    }

    public override setFooter(options: EmbedFooterOptions | null): this {
        let text = "";
        if (options) {
            text = `${options.text}\n`;
        }
        text += `${this._client.user.username} • This is not a source for official briefing • Please use the appropriate forums`;
        if (ObjectUtil.isValidArray(this._sources)) {
            text += ` •  Source: ${this._sources.join(" | ")}`;
        }
        options.text = text;
        return super.setFooter(options);
    }
}
