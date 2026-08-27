const state = { categories: [], minPrice: 0, maxPrice: 2000, minRating: 0, sort: 'featured' };
const categoryList = document.querySelector('#category-list');
const productGrid = document.querySelector('#product-grid');
const emptyState = document.querySelector('#empty-state');
const errorState = document.querySelector('#error-state');
const resultCount = document.querySelector('#result-count');
const activeFilters = document.querySelector('#active-filters');
let requestNumber = 0;

function money(value) { return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 }).format(value); }

function renderCategories(categories) {
  categoryList.innerHTML = categories.map((category) => `<label class="category-option"><input type="checkbox" value="${category}" /><span class="checkbox-ui"></span><span>${category}</span></label>`).join('');
  categoryList.querySelectorAll('input').forEach((input) => input.addEventListener('change', () => {
    state.categories = [...categoryList.querySelectorAll('input:checked')].map((item) => item.value);
    document.querySelector('#category-count').textContent = `${state.categories.length} selected`;
    loadProducts();
  }));
}

function selectedRating() { return Number(document.querySelector('input[name="rating"]:checked').value); }

function syncRange() {
  const min = Number(document.querySelector('#min-price').value);
  const max = Number(document.querySelector('#max-price').value);
  document.querySelector('#price-display').textContent = `${money(min)} — ${money(max)}`;
  const fill = document.querySelector('#range-fill');
  fill.style.left = `${(min / state.maxPrice) * 100}%`;
  fill.style.width = `${((max - min) / state.maxPrice) * 100}%`;
}

function readControls() {
  const minInput = document.querySelector('#min-price');
  const maxInput = document.querySelector('#max-price');
  if (Number(minInput.value) > Number(maxInput.value)) {
    if (document.activeElement === minInput) maxInput.value = minInput.value;
    else minInput.value = maxInput.value;
  }
  state.minPrice = Number(minInput.value);
  state.maxPrice = Number(maxInput.value);
  state.minRating = selectedRating();
  state.sort = document.querySelector('#sort-select').value;
  document.querySelector('#rating-display').textContent = state.minRating ? `${state.minRating}+ stars` : 'Any';
  syncRange();
}

function renderActiveFilters() {
  const pills = [...state.categories.map((category) => `<span class="filter-pill">${category}</span>`), state.minPrice > 0 ? `<span class="filter-pill">From ${money(state.minPrice)}</span>` : '', state.maxPrice < state.maxPriceLimit ? `<span class="filter-pill">Up to ${money(state.maxPrice)}</span>` : '', state.minRating ? `<span class="filter-pill">${state.minRating}+ stars</span>` : ''].filter(Boolean);
  activeFilters.innerHTML = pills.join('');
}

function renderProducts(products) {
  productGrid.innerHTML = products.map((product, index) => `<article class="product-card" style="animation-delay:${Math.min(index * 35, 180)}ms"><div class="product-image-wrap"><span class="category-tag">${product.category}</span><img class="product-image" src="${product.image}" alt="${product.name}" loading="lazy" /></div><div class="product-info"><h3 class="product-name" title="${product.name}">${product.name}</h3><div class="product-meta"><span class="product-price">${money(product.price)}</span><span class="product-rating">★ ${product.rating.toFixed(1)} <span>(${product.reviews})</span></span></div></div></article>`).join('');
}

async function loadProducts() {
  const currentRequest = ++requestNumber;
  readControls();
  renderActiveFilters();
  emptyState.hidden = true;
  errorState.hidden = true;
  resultCount.textContent = 'Updating…';
  const query = new URLSearchParams({ categories: state.categories.join(','), minPrice: state.minPrice, maxPrice: state.maxPrice, minRating: state.minRating, sort: state.sort });
  try {
    const response = await fetch(`/api/catalog?${query}`);
    const data = await response.json();
    if (currentRequest !== requestNumber) return;
    if (!response.ok) throw new Error(data.error || 'Unable to load the collection.');
    resultCount.textContent = `${data.total} ${data.total === 1 ? 'item' : 'items'}`;
    if (data.total === 0) { productGrid.innerHTML = ''; emptyState.hidden = false; } else renderProducts(data.products);
  } catch (error) {
    if (currentRequest !== requestNumber) return;
    productGrid.innerHTML = '';
    resultCount.textContent = 'Unavailable';
    document.querySelector('#error-message').textContent = error.message;
    errorState.hidden = false;
  }
}

function resetFilters() {
  state.categories = [];
  categoryList.querySelectorAll('input').forEach((input) => { input.checked = false; });
  document.querySelector('#min-price').value = state.minPriceLimit;
  document.querySelector('#max-price').value = state.maxPriceLimit;
  document.querySelector('input[name="rating"][value="0"]').checked = true;
  document.querySelector('#sort-select').value = 'featured';
  document.querySelector('#category-count').textContent = '0 selected';
  loadProducts();
}

async function initialize() {
  try {
    const response = await fetch('/api/catalog/options');
    const options = await response.json();
    state.minPriceLimit = options.minPrice;
    state.maxPriceLimit = options.maxPrice;
    state.maxPrice = options.maxPrice;
    document.querySelector('#min-price').max = options.maxPrice;
    document.querySelector('#max-price').max = options.maxPrice;
    document.querySelector('#max-price').value = options.maxPrice;
    renderCategories(options.categories);
    syncRange();
    await loadProducts();
  } catch (error) {
    document.querySelector('#error-message').textContent = error.message;
    errorState.hidden = false;
  }
}

document.querySelectorAll('input[name="rating"]').forEach((input) => input.addEventListener('change', loadProducts));
document.querySelectorAll('.range-wrap input').forEach((input) => input.addEventListener('input', loadProducts));
document.querySelector('#sort-select').addEventListener('change', loadProducts);
document.querySelector('#reset-filters').addEventListener('click', resetFilters);
document.querySelector('#empty-reset').addEventListener('click', resetFilters);
document.querySelector('#retry-button').addEventListener('click', loadProducts);
document.querySelector('#mobile-filter-toggle').addEventListener('click', () => { document.querySelector('#filter-panel').classList.add('open'); document.querySelector('#mobile-filter-toggle').setAttribute('aria-expanded', 'true'); });
document.querySelector('#close-filters').addEventListener('click', () => { document.querySelector('#filter-panel').classList.remove('open'); document.querySelector('#mobile-filter-toggle').setAttribute('aria-expanded', 'false'); });

initialize();
