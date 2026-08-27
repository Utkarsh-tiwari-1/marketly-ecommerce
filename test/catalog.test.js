const test = require('node:test');
const assert = require('node:assert/strict');
const { filterAndSortInventory, parseFilters, products } = require('../server');

test('no filters return the complete inventory', () => {
  assert.equal(filterAndSortInventory(parseFilters({})).length, products.length);
});

test('category, price, and rating filters intersect with AND logic', () => {
  const result = filterAndSortInventory(parseFilters({
    categories: 'Electronics', minPrice: '100', maxPrice: '300', minRating: '4'
  }));
  assert.deepEqual(result.map((product) => product.id), [1, 3]);
  assert.ok(result.every((product) => product.category === 'Electronics' && product.price >= 100 && product.price <= 300 && product.rating >= 4));
});

test('price sorting happens after filtering', () => {
  const result = filterAndSortInventory(parseFilters({ categories: 'Electronics', maxPrice: '300', sort: 'price-asc' }));
  assert.deepEqual(result.map((product) => product.id), [1, 12, 3]);
  assert.deepEqual(result.map((product) => product.price), [129, 139, 249]);
});

test('rating sorting happens after filtering', () => {
  const result = filterAndSortInventory(parseFilters({ categories: 'Electronics', minPrice: '100', maxPrice: '300', sort: 'rating-desc' }));
  assert.deepEqual(result.map((product) => product.id), [1, 3, 12]);
});

test('impossible filters return an empty result', () => {
  assert.deepEqual(filterAndSortInventory(parseFilters({ categories: 'Footwear', maxPrice: '50', minRating: '5' })), []);
});

test('invalid filters are rejected safely', () => {
  for (const query of [
    { categories: 'Unknown' },
    { minPrice: '500', maxPrice: '10' },
    { minPrice: 'not-a-number' },
    { minRating: '6' },
    { sort: 'random' }
  ]) {
    assert.throws(() => parseFilters(query), (error) => error.status === 400);
  }
});
