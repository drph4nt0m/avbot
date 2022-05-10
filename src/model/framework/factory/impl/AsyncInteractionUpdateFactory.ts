import Immutable from "immutable";
import { container, singleton } from "tsyringe";

import { Beans } from "../../DI/Beans.js";
import type { IAsyncRegisterEngine } from "../../engine/IAsyncRegisterEngine.js";
import { AbstractFactory } from "../AbstractFactory.js";

@singleton()
export class AsyncInteractionUpdateFactory extends AbstractFactory<IAsyncRegisterEngine<any>> {
    protected populateEngines(): Immutable.Set<IAsyncRegisterEngine<any>> {
        return Immutable.Set(container.resolveAll(Beans.IAsyncRegisterEngine));
    }
}
