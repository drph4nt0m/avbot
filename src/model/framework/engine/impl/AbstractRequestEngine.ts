import type { AxiosInstance, AxiosRequestConfig, AxiosRequestHeaders } from "axios";
import axios from "axios";
import { container } from "tsyringe";

import logger from "../../../../utils/LoggerFactory.js";
import { Mongo } from "../../../db/Mongo.js";

export type InterceptorOptions = {
    headers?: AxiosRequestHeaders;
    params?: Record<string, any>;
};

export abstract class AbstractRequestEngine {
    public readonly baseUrl: string;
    protected readonly api: AxiosInstance;
    private readonly mongo: Mongo;

    protected constructor(baseURL: string, opts?: InterceptorOptions) {
        this.api = this.axiosInterceptor(
            axios.create({
                ...AbstractRequestEngine.baseOptions,
                baseURL,
                ...opts
            })
        );
        this.baseUrl = baseURL;
        this.mongo = container.resolve(Mongo);
    }

    public static get baseOptions(): AxiosRequestConfig {
        return {
            timeout: 10000,
            // only treat 5xx as errors
            validateStatus: (status): boolean => !(status >= 500 && status < 600)
        };
    }

    private axiosInterceptor(axiosInstance: AxiosInstance): AxiosInstance {
        axiosInstance.interceptors.request.use(async (request) => {
            try {
                const hostname = new URL(request.baseURL).hostname;
                await this.mongo.increaseAPIUsage(hostname);
            } catch (error) {
                logger.error(`[*] ${error}`);
            }
            return request;
        });
        return axiosInstance;
    }
}
