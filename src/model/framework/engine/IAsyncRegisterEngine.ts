import type { AutoUpdateDocument } from "../../Typeings.js";

export type AsyncType = keyof Omit<AutoUpdateDocument, "guildId" | "proxyData" | "bindData">;
export type ResolverInfo<R> = {
    method: {
        proxy: (...params: any[]) => Promise<void> | void;
        args?: any[];
    };
    type: AsyncType;
    service: {
        context: R;
        method: keyof R;
        args: any[];
    };
};

export interface IAsyncRegisterEngine<R> {
    registerAsyncResolverExecutor(bindInfo?: string[], proxyArgs?: string[]): ResolverInfo<R>;
}
