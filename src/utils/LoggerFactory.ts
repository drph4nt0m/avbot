import type winston from "winston";
import {createLogger, format, transports} from "winston";
import type * as Transport from "winston-transport";

import {Property} from "../model/framework/decorators/Property.js";
import type {NODE_ENV} from "../model/Typeings.js";

class LoggerFactory {

    @Property("DATADOG_API_KEY", false)
    private _apiKey: string = null;

    @Property("NODE_ENV")
    private _environment: NODE_ENV;

    private readonly _logger: winston.Logger;

    public get logger(): winston.Logger {
        return this._logger;
    }

    public constructor() {
        const {combine, splat, timestamp, printf} = format;
        const transportsArray: Transport[] = [
            new transports.Console(),
            new transports.File({
                filename: `${process.cwd()}/combined.log`
            })
        ];
        if (this._apiKey) {
            const httpTransportOptions = {
                host: "http-intake.logs.datadoghq.com",
                path: `/v1/input/${this._apiKey}?ddsource=nodejs&service=avbot_${this._environment}`,
                ssl: true
            };
            transportsArray.push(new transports.Http(httpTransportOptions));
        }

        const myFormat = printf(({level: l, message: m, timestamp: t, ...metadata}) => {
            let msg = `⚡ ${t} [${l}] : ${m} `;
            if (metadata && JSON.stringify(metadata) !== "{}") {
                msg += JSON.stringify(metadata);
            }
            return msg;
        });
        this._logger = createLogger({
            format: combine(format.colorize(), splat(), timestamp(), myFormat),
            level: "debug",
            transports: transportsArray
        });
    }
}

const loggerFactory = new LoggerFactory();
export default loggerFactory.logger;
