import { container } from "tsyringe";

import type { propTypes } from "../../Typeings.js";
import type { Property } from "../engine/IPropertyResolutionEngine.js";
import { PropertyResolutionFactory } from "../factory/impl/PropertyResolutionFactory.js";

const factory = container.resolve(PropertyResolutionFactory);
const engines = factory.engines;

/**
 * Get a property from the system. The location where the property is loaded from is agnostic and defined by the registered IPropertyResolutionEngine classes.
 * This acts the similar to Spring's Value annotation
 */
export function Property(
    prop: keyof propTypes,
    required = true
): PropertyDecorator {
    return (target, key): void => {
        let original = target[key];
        Reflect.deleteProperty(target, key);
        Reflect.defineProperty(target, key, {
            configurable: true,
            enumerable: true,
            get: () => {
                let propValue: Property = null;
                for (const resolutionEngine of engines) {
                    const resolvedProp = resolutionEngine.getProperty(prop);
                    if (resolvedProp !== null) {
                        propValue = resolvedProp ?? null;
                        break;
                    }
                }
                if (required && propValue === null) {
                    throw new Error(`Unable to find prop with key "${prop}"`);
                }
                if (
                    !required &&
                    propValue === null &&
                    original !== null &&
                    original !== undefined
                ) {
                    return original;
                }
                return propValue ?? null;
            },
            set: (newVal) => {
                original = newVal;
            }
        });
    };
}
