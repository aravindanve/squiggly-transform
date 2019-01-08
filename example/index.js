const squiggly = require('..').squiggly;
const transform = squiggly({
  name: true,
  nested: {
    description: true,
    age: '#/age',
    website: '1/website'
  },
  count: count => count + 1,
  categoryId: ['#/category', value => value === 'platinum' ? 10 : 0]
});

const source = {
  name: 'Amy',
  nested: {
    description: 'Nothing to see here.'
  },
  age: 26,
  website: 'http://example.com',
  count: 1,
  category: 'platinum'
}

const result = transform(source);

console.log(result);
/* console output:
  { name: 'Amy',
    nested:
    { description: 'Nothing to see here.',
      age: 26,
      website: 'http://example.com' },
    count: 2,
    categoryId: 10 }
*/
