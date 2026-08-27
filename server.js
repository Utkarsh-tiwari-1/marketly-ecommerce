const express = require('express');
const path = require('path');

const app = express();
const PORT = Number(process.env.PORT) || 3000;
const MIN_PRICE = 0;
const MAX_PRICE = 2000;

// This is the master inventory. In a production app this array would be a repository query.
const products = [
  { id: 1, name: 'AeroFit Wireless Headphones', category: 'Electronics', price: 129, rating: 4.8, reviews: 342, image: 'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?auto=format&fit=crop&w=700&q=80', color: '#dbeafe' },
  { id: 2, name: 'PixelPro Mirrorless Camera', category: 'Electronics', price: 899, rating: 4.7, reviews: 188, image: 'https://images.unsplash.com/photo-1516035069371-29a1b244cc32?auto=format&fit=crop&w=700&q=80', color: '#ede9fe' },
  { id: 3, name: 'Orbit Smart Watch', category: 'Electronics', price: 249, rating: 4.3, reviews: 527, image: 'https://images.unsplash.com/photo-1523275335684-37898b6baf30?auto=format&fit=crop&w=700&q=80', color: '#cffafe' },
  { id: 4, name: 'Cloud Knit Everyday Tee', category: 'Apparel', price: 34, rating: 4.5, reviews: 94, image: 'https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?auto=format&fit=crop&w=700&q=80', color: '#fef3c7' },
  { id: 5, name: 'Studio Linen Overshirt', category: 'Apparel', price: 79, rating: 4.1, reviews: 61, image: 'https://images.unsplash.com/photo-1603252110481-7ba873bf42ab?auto=format&fit=crop&w=700&q=80', color: '#fee2e2' },
  { id: 6, name: 'Sundown Trail Runners', category: 'Footwear', price: 118, rating: 4.9, reviews: 416, image: 'https://images.unsplash.com/photo-1542291026-7eec264c27ff?auto=format&fit=crop&w=700&q=80', color: '#ffedd5' },
  { id: 7, name: 'Daybreak Leather Loafers', category: 'Footwear', price: 154, rating: 3.9, reviews: 73, image: 'https://images.unsplash.com/photo-1614252369475-531eca835eb1?auto=format&fit=crop&w=700&q=80', color: '#fef3c7' },
  { id: 8, name: 'Terra Ceramic Planter', category: 'Home & Living', price: 42, rating: 4.6, reviews: 210, image: 'https://images.unsplash.com/photo-1485955900006-10f4d324d411?auto=format&fit=crop&w=700&q=80', color: '#dcfce7' },
  { id: 9, name: 'Arc Task Desk Lamp', category: 'Home & Living', price: 86, rating: 4.4, reviews: 119, image: 'https://images.unsplash.com/photo-1507473885765-e6ed057f782c?auto=format&fit=crop&w=700&q=80', color: '#f3e8ff' },
  { id: 10, name: 'Canvas Weekender Bag', category: 'Accessories', price: 96, rating: 4.2, reviews: 87, image: 'https://images.unsplash.com/photo-1553062407-98eeb64c6a62?auto=format&fit=crop&w=700&q=80', color: '#e0f2fe' },
  { id: 11, name: 'Minimal Gold Chain', category: 'Accessories', price: 64, rating: 4.7, reviews: 156, image: 'https://images.unsplash.com/photo-1611652022419-a9419f74343d?auto=format&fit=crop&w=700&q=80', color: '#fef9c3' },
  { id: 12, name: 'Focus Mechanical Keyboard', category: 'Electronics', price: 139, rating: 3.8, reviews: 65, image: 'https://images.unsplash.com/photo-1587829741301-dc798b83add3?auto=format&fit=crop&w=700&q=80', color: '#e0e7ff' }
];

const categories = [...new Set(products.map((product) => product.category))];

function parseFilters(query) {
  const requestedCategories = query.categories
    ? String(query.categories).split(',').map((category) => category.trim()).filter(Boolean)
    : [];
  const unknownCategory = requestedCategories.find((category) => !categories.includes(category));
  if (unknownCategory) {
    const error = new Error(`Unknown category: ${unknownCategory}`);
    error.status = 400;
    throw error;
  }

  const minPrice = query.minPrice === undefined || query.minPrice === '' ? MIN_PRICE : Number(query.minPrice);
  const maxPrice = query.maxPrice === undefined || query.maxPrice === '' ? MAX_PRICE : Number(query.maxPrice);
  const minRating = query.minRating === undefined || query.minRating === '' ? 0 : Number(query.minRating);
  const sort = query.sort === undefined || query.sort === '' ? 'featured' : String(query.sort);

  if (![minPrice, maxPrice, minRating].every(Number.isFinite)) {
    const error = new Error('Price and rating filters must be valid numbers.');
    error.status = 400;
    throw error;
  }
  if (minPrice < MIN_PRICE || maxPrice > MAX_PRICE || minPrice > maxPrice) {
    const error = new Error(`Price range must be between $${MIN_PRICE} and $${MAX_PRICE}, with minimum no greater than maximum.`);
    error.status = 400;
    throw error;
  }
  if (minRating < 0 || minRating > 5) {
    const error = new Error('Minimum rating must be between 0 and 5.');
    error.status = 400;
    throw error;
  }
  if (!['featured', 'price-asc', 'rating-desc'].includes(sort)) {
    const error = new Error('Sort must be featured, price-asc, or rating-desc.');
    error.status = 400;
    throw error;
  }

  return { categories: requestedCategories, minPrice, maxPrice, minRating, sort };
}

function filterAndSortInventory(filters) {
  // Filtering is intentionally performed before sorting, matching the assessment pipeline.
  const matchingProducts = products.filter((product) => {
    const categoryMatches = filters.categories.length === 0 || filters.categories.includes(product.category);
    const priceMatches = product.price >= filters.minPrice && product.price <= filters.maxPrice;
    const ratingMatches = product.rating >= filters.minRating;
    return categoryMatches && priceMatches && ratingMatches;
  });

  if (filters.sort === 'price-asc') {
    matchingProducts.sort((a, b) => a.price - b.price);
  } else if (filters.sort === 'rating-desc') {
    matchingProducts.sort((a, b) => b.rating - a.rating || b.reviews - a.reviews);
  }
  return matchingProducts;
}

app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

app.get('/api/catalog', (req, res) => {
  try {
    const filters = parseFilters(req.query);
    const results = filterAndSortInventory(filters);
    res.json({
      products: results,
      total: results.length,
      filters,
      inventorySize: products.length
    });
  } catch (error) {
    res.status(error.status || 500).json({ error: error.message || 'Unable to load catalog.' });
  }
});

app.get('/api/catalog/options', (req, res) => {
  res.json({ categories, minPrice: MIN_PRICE, maxPrice: MAX_PRICE, maxRating: 5 });
});

app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

app.listen(PORT, () => {
  console.log(`Marketly is running at http://localhost:${PORT}`);
});

module.exports = { app, filterAndSortInventory, parseFilters, products };
