import { dirname, resolve } from "@discordx/importer";
import { Server } from "@overnightjs/core";
import bodyParser from "body-parser";
import cors from "cors";
import type * as http from "http";
import { container, singleton } from "tsyringe";

import { PostConstruct } from "../model/framework/decorators/PostConstruct.js";
import { Property } from "../model/framework/decorators/Property.js";
import type { NODE_ENV } from "../model/Typeings.js";
import logger from "../utils/LoggerFactory.js";

@singleton()
export class BotServer extends Server {
    @Property("API_SERVER_PORT")
    private readonly port: number;

    @Property("NODE_ENV")
    private readonly env: NODE_ENV;

    private readonly classesToLoad = `${dirname(import.meta.url)}/controllers/**/*.{ts,js}`;

    public constructor() {
        super();
        this.app.use(
            cors({
                origin: this.env === "development" ? "*" : /\.av8\.dev$/
            })
        );
        this.app.use(bodyParser.json());
        this.app.use(bodyParser.urlencoded({ extended: true }));
    }

    private _server: http.Server = null;

    public get server(): http.Server {
        return this._server;
    }

    public start(port: number): http.Server {
        return this.app.listen(port, () => {
            logger.info("Server listening on port: " + port);
        });
    }

    @PostConstruct
    private async init(): Promise<void> {
        if (this._server) {
            return;
        }
        const files = resolve(this.classesToLoad);
        const pArr = files.map((file) => import(file));
        const modules = await Promise.all(pArr);
        for (const module of modules) {
            const moduleKey = Object.keys(module)[0];
            const clazz = module[moduleKey];
            if (container.isRegistered(clazz)) {
                const instance = container.resolve(clazz);
                super.addControllers(instance);
                logger.info(`load ${moduleKey}`);
            }
        }
        this._server = this.start(this.port);
    }
}
