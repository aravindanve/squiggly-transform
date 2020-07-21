# Squiggly Transform

[![Coverage Status](https://coveralls.io/repos/aravindanve/squiggly-transform/badge.svg?branch=master)](https://coveralls.io/r/aravindanve/squiggly-transform?branch=master)

Squiggly Transform allows you to transform objects or arrays of objects based on predetermined schema mappings.

## Usage

Install using NPM:
```bash
npm i -S squiggly-transform
```

Basic Usage:
```ts
import { squiggly } from 'squiggly-transform';

const transform = squiggly({
  name: true,
  profile: {
    age: '#/age',
    about: '1/about'
  }
});

const result = transform({
  name: 'Rosa',
  age: 28,
  about: null,
  other: 289235
});

/* result = {
  name: 'Rosa'
  profile: {
    age: 28,
    about: null
  }
} */
```

Advanced Usage:
```ts
/* types */
interface Source {
  name: string;
  age: string;
  website: string;
  nested: {
    description: string;
  };
  count: number;
  category: string;
}

interface Target {
  name: string;
  nested: {
    description: string;
    age: string;
    website: string;
  };
  count: number;
  categoryId: number;
}


const transform = squiggly<Source, Target>({
  /* explictly defining `squiggly<Source, Target>(...)`
     enforces correct types in schema and in the result object */

  /* map values */
  name: true,                // `true` copies value
  nested: {
    description: true,       // `true` copies nested value
    age: '#/age',            // copies value at json-pointer
    website: '1/website'     // copies value at relative-json-pointer
  },

  /* transform with function */
  count: count => count + 1, // transforms and copies value

  static: () => 'Some Text', // sets static value

  /* map and transform with [json-pointer, function] tuple */
  categoryId: ['#/category', value => getCategoryId(value)]
  /* ^ a tuple of json-pointer and function allows you to
     copy value at the pointed location and transform it */
});
```

## Options:

__`undefinedToNull`__

falls back to `null` for all `undefined` values.

```ts
const transform = squiggly({ name: true, age: true }, {
  undefinedToNull: true
});

transform({}) // = { name: null, age: null }
transform({ name: 'Amy' }) // = { name: 'Amy', age: null }

```

__`noEmptyObjects`__

* falls back to `undefined` for all objects with no keys or with all keys set to `undefined` or `null`.

* when `undefinedToNull` is `true`, falls back to `null` for all objects with no keys or with all keys set to `undefined` or `null`.

```ts
const transform = squiggly({
  name: true,
  profile: { age: true, zipcode: true }

}, {
  noEmptyObjects: true
});

transform({}) // = { name: undefined, profile: undefined }
transform({ name: 'Amy' }) // = { name: 'Amy', profile: undefined }
transform({ profile: { age: 26 } }) // = { name: undefined, profile: { age: 26 } }
```

## Tests

Clone Repository:
```bash
git clone https://github.com/aravindanve/squiggly-transform
```

Run Tests:
```bash
npm run test
```
