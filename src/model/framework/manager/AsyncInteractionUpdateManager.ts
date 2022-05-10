import type { Message } from "discord.js";
import { Client } from "discordx";
import { singleton } from "tsyringe";

import logger from "../../../utils/LoggerFactory.js";
import { ObjectUtil } from "../../../utils/Utils.js";
import { Mongo } from "../../db/Mongo.js";
import type { AutoUpdateDocument } from "../../Typeings.js";
import { PostConstruct } from "../decorators/PostConstruct.js";
import type { AsyncType } from "../engine/IAsyncRegisterEngine.js";
import { AsyncInteractionUpdateFactory } from "../factory/impl/AsyncInteractionUpdateFactory.js";
import Timeout = NodeJS.Timeout;

export class ServiceRunner<T, R> {
    public constructor(
        public message: Message,
        public guildId: string,
        public type: AsyncType,
        public proxy: {
            args?: any[];
            method: (data: T, msg: Message, args: any[]) => void;
        },
        public service: {
            context: R;
            method: keyof R;
            args: any[];
        },
        public interval = 60000
    ) {}
}

@singleton()
export class AsyncInteractionUpdateManager<T, R> {
    private readonly _serviceSet: Map<ServiceRunner<T, R>, Timeout> = new Map();

    public constructor(private _mongo: Mongo, private _asyncInteractionUpdateFactory: AsyncInteractionUpdateFactory) {}

    public async addAsyncWorker(worker: ServiceRunner<T, R>): Promise<void> {
        const fromSet = this.getFromSet(worker);
        if (fromSet) {
            clearTimeout(this._serviceSet.get(fromSet));
            this._serviceSet.delete(fromSet);
        }
        const document: AutoUpdateDocument = {
            guildId: worker.guildId
        };
        worker.type === "metarMessageId" ? (document.metarMessageId = worker.message.id) : (document.tafMessageId = worker.message.id);
        document.bindData = { [worker.type]: worker.service.args };
        document.proxyData = { [worker.type]: worker.proxy.args };
        await this._mongo.addAutoUpdateDocument(document);
        this._serviceSet.set(
            worker,
            setInterval(async () => {
                try {
                    logger.info(this._serviceSet.size);
                    const service = worker.service.context;
                    const serviceResult = await (service[worker.service.method] as unknown as (...args: string[]) => Promise<T>)(...worker.service.args);
                    await worker.proxy.method(serviceResult, worker.message, worker.proxy.args);
                } catch {}
            }, worker.interval)
        );
    }

    private getFromSet(worker: ServiceRunner<T, R>): ServiceRunner<T, R> | null {
        for (const [item] of this._serviceSet) {
            if (item.guildId === worker.guildId && item.type === worker.type) {
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
            for (const key in persistedDocument) {
                if (!Object.prototype.hasOwnProperty.call(persistedDocument, key)) {
                    continue;
                }
                if (key === "guildId" || key === "_id" || key === "bindData") {
                    continue;
                }
                const value: string = persistedDocument[key];

                const channels = [...guild.channels.cache.values()];
                const messageResolvedObject: { [key: string]: Message } = {};
                for (const channel of channels) {
                    const fetchedChannel = await channel.fetch(true);
                    if (!fetchedChannel.isText()) {
                        continue;
                    }
                    let didFind = false;
                    if (ObjectUtil.validString(value)) {
                        try {
                            const message = await fetchedChannel.messages.fetch(value, {
                                force: true,
                                cache: true
                            });
                            didFind = true;
                            messageResolvedObject[key] = message;
                        } catch {}
                    }
                    if (didFind) {
                        break;
                    }
                }
                if (ObjectUtil.isValidObject(messageResolvedObject)) {
                    for (const type in messageResolvedObject) {
                        const executionEngines = this._asyncInteractionUpdateFactory.engines;
                        for (const engine of executionEngines) {
                            const bindData = persistedDocument.bindData[key] ?? [];
                            const proxyData = persistedDocument.proxyData[key] ?? [];
                            const contextHandler = engine.registerAsyncResolverExecutor(bindData, proxyData);
                            if (contextHandler.type === type) {
                                const message: Message = messageResolvedObject[type];
                                const worker = new ServiceRunner<any, any>(
                                    message,
                                    guild.id,
                                    type,
                                    {
                                        args: contextHandler.method.args,
                                        method: contextHandler.method.proxy
                                    },
                                    {
                                        args: bindData,
                                        method: contextHandler.service.method,
                                        context: contextHandler.service.context
                                    },
                                    1000
                                );
                                await this.addAsyncWorker(worker);
                            }
                        }
                    }
                }
            }
        }
    }
}
