import {Client} from "discordx";
import {AsyncTask, SimpleIntervalJob, ToadScheduler} from "toad-scheduler";
import {container} from "tsyringe";

import type METHOD_EXECUTOR_TIME_UNIT from "../../../enums/METHOD_EXECUTOR_TIME_UNIT.js";


export const scheduler = new ToadScheduler();

/**
 * Run a method on this bean every x as defined by the time unit. <br />
 * <strong>Note: the class containing this method must be registered with tsyringe for this decorator to work</strong>
 * @param time
 * @param timeUnit
 * @param runImmediately
 * @constructor
 */
export function RunEvery(time: number, timeUnit: METHOD_EXECUTOR_TIME_UNIT | string, runImmediately = true) {
    const client = container.resolve(Client);
    return function (target: unknown, propertyKey: string, descriptor: PropertyDescriptor): void {
        container.afterResolution(
            target.constructor as never,
            (_t, result) => {
                const task = new AsyncTask("simple task", () => {
                    return descriptor.value.call(result, client);
                }, err => {
                    console.error(err);
                });
                const job = new SimpleIntervalJob({
                    runImmediately,
                    [timeUnit]: time
                }, task);
                scheduler.addSimpleIntervalJob(job);
            },
            {
                frequency: "Once"
            }
        );
    };
}