export declare type TransformCustom<L, R> = (value: R, parents: any[], path: string[]) => L;
export declare type TransformTuple<L> = [string, TransformCustom<L, any>];
export declare type TransformRuleSimple<L, R> = true | string | TransformCustom<L, R> | TransformTuple<L>;
export declare type TransformRule<T extends {}, S extends {}, K extends keyof T> = K extends keyof S ? TransformRuleSimple<T[K], S[K]> | TransformMap<T[K], S[K]> : TransformRuleSimple<T[K], undefined> | TransformMap<T[K], undefined>;
export declare type TransformMap<T extends {}, S extends {}> = {
    [K in keyof T]: TransformRule<T, S, K> | T[K];
};
export declare type TransformItem<T extends {}, S extends {}> = (target: T, source: S, parents: any[], path: string[]) => void;
export declare type Transform<S extends {}, T extends {}> = (source: S, parents?: any[], path?: string[]) => T;
export interface TransformOptions {
    undefinedToNull?: boolean;
    emptyObjectToNull?: boolean;
}
export declare function makeTransform<S extends {}, T extends {}>(transformMap: TransformMap<T, S>, options?: TransformOptions): Transform<S, T>;
