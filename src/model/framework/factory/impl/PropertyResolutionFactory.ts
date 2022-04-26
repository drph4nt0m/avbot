import Immutable from "immutable";
import {container, registry, singleton} from "tsyringe";

import {Beans} from "../../DI/Beans.js";
import {EnvPropertyResolutionEngine} from "../../engine/impl/EnvPropertyResolutionEngine.js";
import type {IPropertyResolutionEngine} from "../../engine/IPropertyResolutionEngine.js";
import {AbstractFactory} from "../AbstractFactory.js";

@registry([
    {token: Beans.IPropertyResolutionEngine, useToken: EnvPropertyResolutionEngine},
])
@singleton()
export class PropertyResolutionFactory extends AbstractFactory<IPropertyResolutionEngine> {

    protected populateEngines(): Immutable.Set<IPropertyResolutionEngine> {
        return Immutable.Set(container.resolveAll(Beans.IPropertyResolutionEngine));
    }
}
