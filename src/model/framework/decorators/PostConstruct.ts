import { Client } from "discordx";
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
            let client: Client;
            if (container.isRegistered(Client)) {
                client = container.resolve(Client);
            }
            descriptor.value.call(result, client);
        },
        {
            frequency: "Once"
        }
    );
}
