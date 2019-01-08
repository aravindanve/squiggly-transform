import { squiggly } from '../src';
import { expect } from 'chai';
import 'mocha';

const stringify = JSON.stringify;

describe('squiggly()', () => {
  it('should return a function', () => {
    const transform = squiggly({});

    expect(transform).to.be.a('function');
  });
});

describe('empty schema', () => {
  it('should always result in {}', () => {
    const transform = squiggly({});
    const rhs = stringify({});

    expect(stringify(transform({}))).to.equal(rhs);
    expect(stringify(transform({
      message: 'Hello',
      nested: {
        deepNested: {
          num: 1
        }
      }

    }))).to.equal(rhs);
  });
});

describe('non-objects', () => {
  it('should always result in {}', () => {
    const transform = squiggly({});
    const rhs = stringify({});

    expect(stringify(transform(125))).to.equal(rhs);
    expect(stringify(transform('hello'))).to.equal(rhs);
    expect(stringify(transform(new Date()))).to.equal(rhs);
    expect(stringify(transform(['a']))).to.equal(rhs);
  });
});

describe('rule: true', () => {
  it('should copy value in place', () => {
    const transform = squiggly({ value: true });

    expect(transform({ value: 42 }).value).to.equal(42);
    expect(transform({ value: 'hello' }).value).to.equal('hello');
    expect(transform({ value: false }).value).to.equal(false);
    expect(transform({ value: null }).value).to.equal(null);
  });

  it('should copy nested value in place', () => {
    const transform = squiggly({
      level1: { level2: { level3: { value: true }}}});

    expect(transform({
      level1: { level2: { level3: { value: 42 }}}
    }).level1.level2.level3.value).to.equal(42);

    expect(transform({
      level1: { level2: { level3: { value: 'hello' }}}
    }).level1.level2.level3.value).to.equal('hello');

    expect(transform({
      level1: { level2: { level3: { value: false }}}
    }).level1.level2.level3.value).to.equal(false);

    expect(transform({
      level1: { level2: { level3: { value: null }}}
    }).level1.level2.level3.value).to.equal(null);
  });

  it('should omit values not in schema', () => {
    const transform = squiggly({ value: true });

    expect(transform({ other: 42 })['other']).to.equal(undefined);
    expect(transform({ other: 'hello' })['other']).to.equal(undefined);
    expect(transform({ other: false })['other']).to.equal(undefined);
    expect(transform({ other: null })['other']).to.equal(undefined);
  });
});

describe('rule: json-pointer', () => {
  it('should copy value at pointer', () => {
    const transform = squiggly({ value: '#/other' });

    expect(transform({ other: 42 }).value).to.equal(42);
    expect(transform({ other: 'hello' }).value).to.equal('hello');
    expect(transform({ other: false }).value).to.equal(false);
    expect(transform({ other: null }).value).to.equal(null);
  });

  it('should copy nested value at pointer', () => {
    const transform = squiggly({ value: '#/other/nested/value' });

    expect(transform({ other: { nested: { value: 42 }}}).value).to.equal(42);
    expect(transform({ other: { nested: { value: 'hello' }}}).value).to.equal('hello');
    expect(transform({ other: { nested: { value: false }}}).value).to.equal(false);
    expect(transform({ other: { nested: { value: null }}}).value).to.equal(null);
  });

  it('should copy value at pointer to nested location', () => {
    const transform = squiggly({ level1: { level2: { value: '#/other' }}});

    expect(transform({ other: 42 }).level1.level2.value).to.equal(42);
    expect(transform({ other: 'hello' }).level1.level2.value).to.equal('hello');
    expect(transform({ other: false }).level1.level2.value).to.equal(false);
    expect(transform({ other: null }).level1.level2.value).to.equal(null);
  });

  it('should copy value at relative pointer at level -0', () => {
    const transform = squiggly({ level1: { level2: { value: '0/other' }}});

    expect(transform({ level1: { level2: { other: 42 }}}).level1.level2.value).to.equal(42);
    expect(transform({ level1: { level2: { other: 'hello' }}}).level1.level2.value).to.equal('hello');
    expect(transform({ level1: { level2: { other: false }}}).level1.level2.value).to.equal(false);
    expect(transform({ level1: { level2: { other: null }}}).level1.level2.value).to.equal(null);
  });

  it('should copy value at relative pointer at level -1', () => {
    const transform = squiggly({ level1: { level2: { value: '1/other' }}});

    expect(transform({ level1: { other: 42 }}).level1.level2.value).to.equal(42);
    expect(transform({ level1: { other: 'hello' }}).level1.level2.value).to.equal('hello');
    expect(transform({ level1: { other: false }}).level1.level2.value).to.equal(false);
    expect(transform({ level1: { other: null }}).level1.level2.value).to.equal(null);
  });

  it('should skip relative pointer with invalid level', () => {
    const transform = squiggly({ level1: { level2: { value: '5/other' }}});

    expect(transform({ level1: { level2: { other: 42 }}}).level1.level2.value).to.equal(undefined);
    expect(transform({ level1: { level2: { other: 'hello' }}}).level1.level2.value).to.equal(undefined);
    expect(transform({ level1: { level2: { other: false }}}).level1.level2.value).to.equal(undefined);
    expect(transform({ level1: { level2: { other: null }}}).level1.level2.value).to.equal(undefined);
  });
});

describe('rule: function', () => {
  it('should transform value in place', () => {
    const transform = squiggly({ value: value => value + 1 });

    expect(transform({ value: 42 }).value).to.equal(43);
    expect(transform({ value: 235 }).value).to.equal(236);
    expect(transform({ value: 'hello' }).value).to.equal('hello1');
  });

  it('should expose parents and path as arguments', () => {
    const transform = squiggly({ value: (value, parents, path) => {
      expect(parents).to.be.a('array');
      expect(path).to.be.a('array');

      return value;
    }});

    expect(transform({ value: 42 }).value).to.equal(42);
  });

  it('should continue on error', () => {
    const transform = squiggly({
      value1: true,
      value2: () => {
        throw new Error('Random error');
      },
      value3: true
    });

    expect(transform({ value1: 42, value2: 265, value3: 'hello' }).value1).to.equal(42);
    expect(transform({ value1: 42, value2: 265, value3: 'hello' }).value3).to.equal('hello');
  });
});

describe('rule: tuple', () => {
  it('should transform and copy value at json-pointer', () => {
    const transform = squiggly({ value: ['#/other', value => value + 1] });

    expect(transform({ other: 42 }).value).to.equal(43);
    expect(transform({ other: 235 }).value).to.equal(236);
    expect(transform({ other: 'hello' }).value).to.equal('hello1');
  });

  it('should expose parents and path as arguments', () => {
    const transform = squiggly({ value: ['#/other', (value, parents, path) => {
      expect(parents).to.be.a('array');
      expect(path).to.be.a('array');

      return value;
    }]});

    expect(transform({ other: 42 }).value).to.equal(42);
  });
});

describe('Literals', () => {
  it('should copy literals', () => {
    const transform = squiggly({
      string: 'literal',
      number: 2355,
      boolean: false,
      null: null,
      object: {
        name: 'Hello World!'
      },
      array: [1, 2, 3]
    });
    const result = transform({});

    expect(result.string).to.equal('literal');
    expect(result.number).to.equal(2355);
    expect(result.boolean).to.equal(false);
    expect(result.null).to.equal(null);
    expect(stringify(result.object)).to.equal(stringify({ name: 'Hello World!' }));
    expect(stringify(result.array)).to.equal(stringify([1, 2, 3]));
  });
});

describe('option: undefinedToNull', () => {
  it('must set undefined values to null', () => {
    const transform = squiggly({
      value1: true,
      value2: true

    }, {
      undefinedToNull: true
    });

    expect(transform({}).value1).to.equal(null);
    expect(transform({}).value2).to.equal(null);
  });
});

describe('option: emptyObjectToNull', () => {
  it('must set empty objects to null', () => {
    const transform = squiggly({
      object1: {
        value1: true,
        value2: '#/value3'
      },
      object2: {
        value1: true,
        value2: '#/object1/value2'
      }

    }, {
      emptyObjectToNull: true
    });

    expect(transform({}).object1).to.equal(null);
    expect(transform({}).object2).to.equal(null);
    expect(transform({ object1: { value2: 2354 } }).object1).to.equal(null);
    expect(transform({ object1: { value2: 2354 } }).object2).to.not.equal(null);
  });

  it('must set empty objects to null with undefinedToNull enabled', () => {
    const transform = squiggly({
      object1: {
        value1: true,
        value2: '#/value3'
      },
      object2: {
        value1: true,
        value2: '#/object1/value1'
      }

    }, {
      undefinedToNull: true,
      emptyObjectToNull: true
    });

    expect(transform({}).object1).to.equal(null);
    expect(transform({}).object2).to.equal(null);
  });
});
