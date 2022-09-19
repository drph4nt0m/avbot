import { singleton } from "tsyringe";

import type { IPropertyResolutionEngine, PropertyType } from "../IPropertyResolutionEngine";

@singleton()
export class EnvPropertyResolutionEngine implements IPropertyResolutionEngine {
    public getProperty(prop: string): PropertyType {
        return process.env[prop] ?? null;
    }
}
