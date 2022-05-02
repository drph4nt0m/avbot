import { container } from "tsyringe";

/**
 * Spring-like post construction executor, this will fire after a dependency is resolved and constructed
 * @param target
 * @param propertyKey
 * @param descriptor
 * @constructor
 */
export function PostConstruct(target: unknown, propertyKey: string, descriptor: PropertyDescriptor): void {
    container.afterResolution(
        target.constructor as never,
        (_t, result) => {
            descriptor.value.call(result);
        },
        {
            frequency: "Once"
        }
    );
}
