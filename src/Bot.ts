import "reflect-metadata";

import { dirname, importx } from "@discordx/importer";
import { IntentsBitField } from "discord.js";
import { Client, DIService, tsyringeDependencyRegistryEngine } from "discordx";
import { container } from "tsyringe";

import { Property } from "./model/framework/decorators/Property.js";
import { AutoCompleteHealthChecker } from "./model/logic/AutoCompleteHealthChecker.js";
import type { NODE_ENV } from "./model/Typeings.js";

// polly-fill for bigint serialisation
(BigInt.prototype as any).toJSON = function (): string {
    return this.toString();
};

class Bot {
    @Property("DISCORD_TOKEN")
    private static readonly token: string;

    @Property("NODE_ENV")
    private static readonly environment: NODE_ENV;

    public static async start(): Promise<void> {
        DIService.engine = tsyringeDependencyRegistryEngine.setInjector(container);
        const clientOps = {
            intents: [IntentsBitField.Flags.Guilds, IntentsBitField.Flags.DirectMessages, IntentsBitField.Flags.GuildVoiceStates],
            silent: this.environment !== "development"
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
        await importx(`${dirname(import.meta.url)}/{events,commands}/**/*.{ts,js}`);
        await client.login(Bot.token);
    }
}

await Bot.start();
