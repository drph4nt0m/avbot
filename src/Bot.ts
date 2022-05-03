import "reflect-metadata";

import { dirname, importx } from "@discordx/importer";
import { Intents } from "discord.js";
import { Client, DIService } from "discordx";
import { container } from "tsyringe";

import { Property } from "./model/framework/decorators/Property.js";
import { AutoCompleteHealthChecker } from "./model/logic/AutoCompleteHealthChecker.js";
import type { NODE_ENV } from "./model/Typeings.js";

class Bot {
    @Property("DISCORD_TOKEN")
    private static readonly token: string;

    @Property("NODE_ENV")
    private static readonly environment: NODE_ENV;

    public static async start(): Promise<void> {
        DIService.container = container;
        const clientOps = {
            intents: [
                Intents.FLAGS.GUILDS,
                Intents.FLAGS.GUILD_MEMBERS,
                Intents.FLAGS.GUILD_MESSAGE_REACTIONS,
                Intents.FLAGS.GUILD_PRESENCES,
                Intents.FLAGS.DIRECT_MESSAGES,
                Intents.FLAGS.DIRECT_MESSAGE_REACTIONS,
                Intents.FLAGS.GUILD_VOICE_STATES
            ],
            silent: false
        };
        if (this.environment === "development") {
            clientOps["botGuilds"] = [(client: Client): string[] => client.guilds.cache.map((guild) => guild.id)];
        }
        const client = new Client(clientOps);

        if (!container.isRegistered(Client)) {
            container.registerInstance(Client, client);
        }
        const healthChecker = container.resolve(AutoCompleteHealthChecker);
        await healthChecker.healthCheck();
        await importx(dirname(import.meta.url) + "/{events,commands}/**/*.{ts,js}");
        await client.login(Bot.token);
    }
}

await Bot.start();
