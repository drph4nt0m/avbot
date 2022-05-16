import { singleton } from "tsyringe";

import type { IPropertyResolutionEngine, Property } from "../IPropertyResolutionEngine";

@singleton()
export class EnvPropertyResolutionEngine implements IPropertyResolutionEngine {
    public getProperty(prop: string): Property {
        return process.env[prop] ?? null;
    }
}
