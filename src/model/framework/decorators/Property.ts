import { container } from "tsyringe";

import type { propTypes } from "../../Typeings.js";
import { PropertyResolutionManager } from "../manager/PropertyResolutionManager.js";

const manager = container.resolve(PropertyResolutionManager);

/**
 * Get a property from the system. The location where the property is loaded from is agnostic and defined by the registered IPropertyResolutionEngine classes.
 * This acts the similar to Spring's Value annotation
 */
export function Property(prop: keyof propTypes, required = true): PropertyDecorator {
    return (target, key): void => {
        let original = target[key];
        Reflect.deleteProperty(target, key);
        Reflect.defineProperty(target, key, {
            configurable: true,
            enumerable: true,
            get: () => {
                const propValue = manager.getProperty(prop);
                if (required && propValue === null) {
                    throw new Error(`Unable to find prop with key "${prop}"`);
                }
                if (!required && propValue === null && original !== null && original !== undefined) {
                    return original;
                }
                return propValue;
            },
            set: (newVal) => {
                original = newVal;
            }
        });
    };
}
