import type { CommandInteraction } from "discord.js";
import { Client } from "discordx";
import { singleton } from "tsyringe";

import { ObjectUtil } from "../../../utils/Utils.js";
import { Mongo } from "../../db/Mongo.js";
import { PostConstruct } from "../decorators/PostConstruct.js";
import Timeout = NodeJS.Timeout;

@singleton()
export class AsyncInteractionUpdateManager<T> {
    private readonly _serviceSet: Map<ServiceRunner<T>, Timeout> = new Map();

    public constructor(private _mongo: Mongo) {}

    public addAsyncWorker(worker: ServiceRunner<T>): void {
        const fromSet = this.getFromSet(worker);
        if (fromSet) {
            clearTimeout(this._serviceSet.get(fromSet));
            this._serviceSet.delete(fromSet);
        }
        this._serviceSet.set(
            worker,
            setInterval(async () => {
                try {
                    const result = await worker.proxy();
                    worker.service(result, worker.interaction);
                } catch {}
            }, worker.interval)
        );
    }

    private getFromSet(worker: ServiceRunner<T>): ServiceRunner<T> | null {
        for (const [item] of this._serviceSet) {
            if (item.guildId === worker.guildId && item.messageId === worker.messageId) {
                return item;
            }
        }
        return null;
    }

    @PostConstruct
    private async initMessages(client: Client): Promise<void> {
        const guildCache = client.guilds.cache;
        for (const [id, guild] of guildCache) {
            const persistedDocument = await this._mongo.getAutoUpdateDocument(id);
            if (!persistedDocument) {
                continue;
            }
            const { metarMessageId, tafMessageId } = persistedDocument;
            const channels = [...guild.channels.cache.values()];
            for (const channel of channels) {
                const fetchedChannel = await channel.fetch(true);
                if (!fetchedChannel.isText()) {
                    continue;
                }
                let didFind = false;
                if (ObjectUtil.validString(metarMessageId)) {
                    try {
                        const message = await fetchedChannel.messages.fetch(metarMessageId, {
                            force: true,
                            cache: true
                        });
                        console.log(`metar Message found: ${message}`);
                        didFind = true;
                    } catch {}
                }
                if (ObjectUtil.validString(tafMessageId)) {
                    try {
                        const message = await fetchedChannel.messages.fetch(tafMessageId, {
                            force: true,
                            cache: true
                        });
                        console.log(`taf Message found: ${message}`);
                        didFind = true;
                    } catch {}
                }
                if (didFind) {
                    break;
                }
            }
        }
    }
}

export class ServiceRunner<T> {
    public constructor(
        public messageId: string,
        public guildId: string,
        public interaction: CommandInteraction,
        public proxy: (...params: any[]) => Promise<T>,
        public service: (data: T, interaction: CommandInteraction) => void,
        public interval = 60000
    ) {}
}
