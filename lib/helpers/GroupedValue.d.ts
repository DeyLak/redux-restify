export default GroupedValue;
export function assignAndGroup(obj1: any, obj2: any): any;
export function groupObjects(array: any, transformFunc?: (o: any) => any): any;
export const flushGroupedValues: (obj: any) => any;
declare class GroupedValue {
    constructor(sum?: number, count?: number, roundCount?: number);
    sum: number;
    count: number;
    roundCount: number;
    value: number;
    clone(): GroupedValue;
    toString(): number | "-";
    addToGrouped(sum: any, count?: number): GroupedValue;
}
