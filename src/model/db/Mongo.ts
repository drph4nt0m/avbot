import type { Document } from "bson";
import type { Collection, Db } from "mongodb";
import { MongoClient } from "mongodb";
import { singleton } from "tsyringe";

import logger from "../../utils/LoggerFactory.js";
import { Utils } from "../../utils/Utils.js";
import { PostConstruct } from "../framework/decorators/PostConstruct.js";
import { Property } from "../framework/decorators/Property.js";
import type { AutoUpdateDocument, CommandCount, Settings, Stats } from "../Typeings.js";

@singleton()
export class Mongo {
    @Property("MONGODB_URI")
    private uri: string;

    private _db: Db;

    public get db(): Db {
        return this._db;
    }

    public async isPremiumGuild(guildId: string): Promise<boolean> {
        try {
            const settings = await this.getCollection<Settings>("settings");
            const guildSettings = await settings.findOne({ guild: guildId });
            return Boolean(guildSettings.isPremium);
        } catch (error) {
            return false;
        }
    }

    public increaseCommandCount(command: string): Promise<boolean> {
        return this.update("stats", command);
    }

    public async getAutoUpdateDocument(guildId: string): Promise<AutoUpdateDocument | null> {
        try {
            const autoUpdateCollection = await this.getCollection<AutoUpdateDocument>("autoUpdate");
            return await autoUpdateCollection.findOne({ guildId });
        } catch (error) {
            return null;
        }
    }

    public async addAutoUpdateDocument(document: AutoUpdateDocument): Promise<boolean> {
        try {
            const autoUpdateCollection = await this.getCollection<AutoUpdateDocument>("autoUpdate");
            const { guildId } = document;
            const result = await autoUpdateCollection.updateOne({ guildId }, { $set: { document } }, { upsert: true });
            return result.acknowledged;
        } catch (error) {
            return false;
        }
    }

    public async getCommandCounts(): Promise<CommandCount> {
        try {
            const stats = await this.getCollection<Stats>("stats");
            const counts = await stats.find().toArray();
            let total = 0;
            for (const c of counts) {
                total += c.count;
            }
            return { counts, total };
        } catch (error) {
            return null;
        }
    }

    public increaseAPIUsage(hostname: string): Promise<boolean> {
        return this.update("api-usage", hostname);
    }

    public async getAPIUsage(): Promise<Document[]> {
        const apiUsage = await this.getCollection("api-usage");
        return apiUsage.find().toArray();
    }

    @PostConstruct
    private async init(): Promise<void> {
        // useNewUrlParser and useUnifiedTopology are no longer supported:  https://mongoosejs.com/docs/migrating_to_6.html#no-more-deprecation-warning-options and https://stackoverflow.com/questions/56306484/type-error-using-usenewurlparser-with-mongoose-in-typescript
        let mongoClient: MongoClient = null;
        try {
            mongoClient = await MongoClient.connect(this.uri);
            logger.info("MongoDB Connected");
            this._db = mongoClient.db("avbot");
        } catch (error) {
            logger.error(error);
        }
    }

    private async update(collectionName: string, value: string): Promise<boolean> {
        const collection = await this.getCollection<Stats>(collectionName);
        try {
            const result = await collection.updateOne({ value }, { $inc: { count: 1 } }, { upsert: true });
            return result.acknowledged;
        } catch (error) {
            logger.error(`[x] ${error}`);
            return false;
        }
    }

    private async getCollection<T>(collectionToUse: string): Promise<Collection<T>> {
        try {
            while (!this._db) {
                // eslint-disable-next-line no-await-in-loop
                await Utils.sleep(10000);
            }
            return this._db.collection<T>(collectionToUse);
        } catch (error) {
            logger.error(`[x] ${error}`);
            throw error;
        }
    }
}
