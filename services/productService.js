const { searchDocuments } = require("../lib/elasticsearch");

const PRODUCTS_INDEX = "products";
const PRODUCTS_PAGE_SIZE = 12;
const PRODUCT_SORT_FIELDS = {
  name: "name.keyword",
  price: "price",
  quantity: "quantity",
};

async function getDashboardStats() {
  try {
    const result = await searchDocuments({
      index: PRODUCTS_INDEX,
      size: 0,
      aggregations: {
        categories: { terms: { field: "category", size: 100 } },
        countries: { terms: { field: "country", size: 100 } },
      },
    });

    return {
      total: result.total,
      categories: result.aggregations.categories?.buckets || [],
      countries: result.aggregations.countries?.buckets || [],
    };
  } catch (error) {
    console.error("Dashboard product analytics failed:", error.message);
    return { total: 0, categories: [], countries: [] };
  }
}

async function searchProducts({ search, category, country, minPrice, maxPrice, sortBy, order, page }) {
  const sortField = PRODUCT_SORT_FIELDS[sortBy] || PRODUCT_SORT_FIELDS.name;
  const filters = [];

  if (category) filters.push({ term: { category } });
  if (country) filters.push({ term: { country } });
  if (minPrice !== undefined || maxPrice !== undefined) {
    filters.push({
      range: {
        price: {
          ...(minPrice !== undefined ? { gte: minPrice } : {}),
          ...(maxPrice !== undefined ? { lte: maxPrice } : {}),
        },
      },
    });
  }

  const searchOptions = {
    index: PRODUCTS_INDEX,
    query: search ? { multi_match: { query: search, fields: ["name^2", "category", "country"] } } : undefined,
    filters,
    sort: [{ [sortField]: order }, { id: order }],
    size: PRODUCTS_PAGE_SIZE,
    aggregations: {
      categories: { terms: { field: "category", size: 100 } },
      countries: { terms: { field: "country", size: 100 } },
    },
  };

  let result;
  let usedPage = page;
  let error = "";

  try {
    result = await searchDocuments({ ...searchOptions, from: (page - 1) * PRODUCTS_PAGE_SIZE });
    
    if (page > 1 && result.total > 0 && result.hits.length === 0) {
      usedPage = 1;
      result = await searchDocuments({ ...searchOptions, from: 0 });
    }
  } catch (searchError) {
    console.error("Products search failed:", searchError.message);
    result = { hits: [], total: 0, aggregations: {} };
    error = "Products are temporarily unavailable. Please try again shortly.";
  }

  return { result, page: usedPage, error };
}

module.exports = {
  PRODUCTS_PAGE_SIZE,
  PRODUCT_SORT_FIELDS,
  getDashboardStats,
  searchProducts,
};
