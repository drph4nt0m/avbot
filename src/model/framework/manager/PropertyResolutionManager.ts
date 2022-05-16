import { singleton } from "tsyringe";

import type { Property } from "../engine/IPropertyResolutionEngine.js";
import { PropertyResolutionFactory } from "../factory/impl/PropertyResolutionFactory.js";

@singleton()
/**
 * Manager to obtain property from the PropertyResolutionFactory
 */
export class PropertyResolutionManager {
    public constructor(private _propertyResolutionFactory: PropertyResolutionFactory) {}

    /**
     * Get system property
     * @param {string} prop
     * @returns {Property}
     */
    public getProperty(prop: string): Property {
        let propValue: Property = null;
        for (const resolutionEngine of this._propertyResolutionFactory.engines) {
            const resolvedProp = resolutionEngine.getProperty(prop);
            if (resolvedProp !== null) {
                propValue = resolvedProp ?? null;
                break;
            }
        }
        return propValue ?? null;
    }
}
