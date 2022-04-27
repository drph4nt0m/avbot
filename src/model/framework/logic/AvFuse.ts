import Fuse from "fuse.js";

import {ObjectUtil} from "../../../utils/Utils.js";
import type {SearchBase} from "../ISearchBase";

export class AvFuse<T extends SearchBase> extends Fuse<T> {
    public getFirstNItems(amount: number, filter: {
        key: keyof T,
        value?: string
    } = {key: "name"}): Fuse.FuseResult<T>[] {
        const json = this.getIndex();
        // eslint-disable-next-line @typescript-eslint/ban-ts-comment
        // @ts-ignore
        const collection = json.docs as T[];
        if (!ObjectUtil.isValidArray(collection)) {
            return [];
        }
        const returnOb: Fuse.FuseResult<T>[] = [];
        let max = amount;
        const len = collection.length;
        for (let i = 0; i < max; i++) {
            if (i === len) {
                break;
            }

            const item = collection[i];
            if (!ObjectUtil.validString(item[filter.key])) {
                max++;
                continue;
            }
            if (ObjectUtil.validString(filter.value)) {
                const value: any = item[filter.key];
                if (value !== filter.value) {
                    max++;
                    continue;
                }
            }
            returnOb.push({
                item: item,
                refIndex: i
            });
        }
        return returnOb;
    }
}
