import { singleton } from "tsyringe";

import type { IPropertyResolutionEngine, PropertyTYpe } from "../IPropertyResolutionEngine";

@singleton()
export class EnvPropertyResolutionEngine implements IPropertyResolutionEngine {
    public getProperty(prop: string): PropertyTYpe {
        return process.env[prop] ?? null;
    }
}
