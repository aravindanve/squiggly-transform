export type TransformCustom<L, R> =
  (value: R, parents: any[], path: string[]) => L;

export type TransformTuple<L> =
  [string, TransformCustom<L, any>];

export type TransformRuleSimple<L, R> =
  true |
  string |
  TransformCustom<L, R> |
  TransformTuple<L>;

export type TransformRule<T extends {}, S extends {} | null | undefined, K extends keyof T> =
  K extends keyof S
    ? TransformRuleSimple<T[K], S[K]> | TransformMap<T[K], S[K]>
    : TransformRuleSimple<T[K], undefined> | TransformMap<T[K], undefined>;

export type TransformMap<T extends {}, S extends {} | null | undefined> = {
  [K in keyof T]: TransformRule<T, S, K> | T[K];
};

export type TransformItem<T extends {}, S extends {} | null | undefined> =
  (target: T, source: S, parents: any[], path: string[]) => void;

export type Transform<S extends {} | null | undefined, T extends {}> =
  (source: S, parents?: any[], path?: string[]) => T;

export interface TransformOptions {
  undefinedToNull?: boolean;
  noEmptyObjects?: boolean;
}

type GET_KEY<S, K> = K extends keyof S ? S[K] : undefined;

const POINTER_PATTERN = /^(?:#|[0-9]+)\//;

function typeOf<T>(value: T): string {
  const type = typeof value;

  if (type !== 'object') {
    return type;

  } else if (value === null) {
    return 'null';

  } else if (Array.isArray(value)) {
    return 'array';

  } else {
    return 'object';
  }
}

function isEmptyObject<T extends {}>(value: T): boolean {
  const keys = Object.keys(value);

  for (let i = 0; i < keys.length; i++) {
    if (value[keys[i]] !== undefined && value[keys[i]] !== null) {
      return false;
    }
  }

  return true;
}

function isPointer(value: any): value is string {
  return typeof value === 'string' && POINTER_PATTERN.test(value);
}

function isTransformCustom<L, R>(value: any): value is TransformCustom<L, R> {
  return typeof value === 'function';
}

function isTransformTuple<L>(value: any): value is TransformTuple<L> {
  return Array.isArray(value) &&
    isPointer(value[0]) &&
    isTransformCustom(value[1]);
}

function isTransformMap<T, S>(value: any): value is TransformMap<T, S> {
  return typeof value === 'object' &&
    value !== null &&
    !Array.isArray(value);
}

function setProperty<T extends {}, K extends keyof T>(
  target: T,
  key: K,
  value: T[K],
  options: TransformOptions

): void {
  if (value === undefined) {
    target[key] = options.undefinedToNull
      ? null as any: undefined as any;

  } else {
    target[key] = value;
  }
}

// TODO: unescape pointer parts
function getByPointer<S extends {} | null | undefined>(
  pointer: string,
  source: S,
  parents: any[]

): any {
  let lastSource;

  try {
    const path = pointer.split(/\//g);
    const base = path.shift() || '';

    if (base === '#') {
      lastSource = parents[0] || source;

    } else if (+base === 0) {
      lastSource = source;

    } else {
      lastSource = parents[parents.length - (+base)];
    }

    for (let i = 0; i < path.length; i++) {
      lastSource = lastSource[path[i]];
    }

  } catch (err) {
    // do nothing
  }

  return lastSource;
}

function makeTransformItem<T extends {}, S extends {}, K extends keyof T>(
  key: K,
  rule: TransformRule<T, S, K> | T[K],
  options: TransformOptions

): TransformItem<T, S> {
  if (rule === true) {
    // copy value in place
    return (target, source) =>
      setProperty(
        target,
        key,
        source[key as string],
        options);

  } else if (isPointer(rule)) {
    // copy value at pointer from source
    return (target, source, parents) =>
      setProperty(
        target,
        key,
        getByPointer(rule, source, parents),
        options);

  } else if (isTransformCustom<T[K], GET_KEY<S, K>>(rule)) {
    // transform value in place
    return (target, source, parents, path) =>
      setProperty(
        target,
        key,
        rule(source[key as string], parents, path),
        options);

  } else if (isTransformTuple<T[K]>(rule)) {
    // NOTE: ts typeguard bug?
    let transformCustom = (rule as TransformTuple<T[K]>)[1];

    // transform value at pointer from source
    return (target, source, parents, path) => {
      const value = getByPointer(rule[0], source, parents);

      setProperty(
        target,
        key,
        transformCustom(
          value,
          parents,
          path),
        options);
    };

  } else if (isTransformMap<T[K], GET_KEY<S, K>>(rule)) {
    const transform = squiggly<GET_KEY<S, K>, T[K]>(rule, options);

    // transform object
    return (target, source, parents, path) => {
      setProperty(
        target,
        key,
        transform(
          source[key as string],
          parents.concat(source),
          path.concat(key as string)),
        options);

      // empty object check
      if (options.noEmptyObjects &&
          isEmptyObject(target[key])) {
        target[key] = options.undefinedToNull
          ? null as any : undefined as any;
      }
    };

  } else {
    // interpret value as literal
    return (target) =>
      target[key] = rule as any;
  }
}

export function squiggly<S extends {} | null | undefined, T extends {}>(
  transformMap: TransformMap<T, S>,
  options: TransformOptions = {}

): Transform<S, T> {
  const transformItems = (Object.keys(transformMap) as (keyof T)[])
    .map(key => makeTransformItem(key, transformMap[key], options));

  return (source, parents = [], path = []) => {
    const target: any = {};

    // ensure source is an object
    source = typeOf(source) === 'object' ? source : {} as S;

    // apply transform items
    for (const transformItem of transformItems) {
      try {
        transformItem(target, source as any, parents, path);

      } catch (err) {
        continue;
      }
    }

    return target as T;
  };
}
