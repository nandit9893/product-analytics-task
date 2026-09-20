const eta = require("../lib/eta");
const { getAuthUser } = require("../lib/auth");
const { searchDocuments } = require("../lib/elasticsearch");

const PRODUCTS_INDEX = "products";
const PRODUCTS_PAGE_SIZE = 12;
const PRODUCT_SORT_FIELDS = {
  name: "name.keyword",
  price: "price",
  quantity: "quantity",
};

function decodeCursor(value) {
  if (!value) return undefined;

  try {
    const cursor = JSON.parse(Buffer.from(value, "base64url").toString("utf8"));
    return Array.isArray(cursor) ? cursor : undefined;
  } catch {
    return undefined;
  }
}

function encodeCursor(sortValues) {
  return Buffer.from(JSON.stringify(sortValues)).toString("base64url");
}

function createProductsUrl(filters, cursor) {
  const params = new URLSearchParams();

  Object.entries(filters).forEach(([key, value]) => {
    if (!value || (key === "sort" && value === "name") || (key === "order" && value === "asc")) return;
    params.set(key, value);
  });

  if (cursor) params.set("cursor", cursor);
  const queryString = params.toString();
  return queryString ? `/products?${queryString}` : "/products";
}

function parsePrice(value) {
  const price = Number(value);
  return Number.isFinite(price) && price >= 0 ? price : undefined;
}

function normalizeQueryValue(value) {
  if (!value) return "";

  try {
    return decodeURIComponent(String(value).replace(/\+/g, " ")).trim();
  } catch {
    return String(value).trim();
  }
}

function parsePage(value) {
  const page = Number.parseInt(value, 10);
  return Number.isInteger(page) && page > 0 ? Math.min(page, 1000) : 1;
}

async function showLanding(c) {
  return c.html(eta.render("landing", { user: getAuthUser(c) }));
}

async function showDashboard(c) {
  let productStats = { total: 0, categories: [], countries: [] };

  try {
    const result = await searchDocuments({
      index: PRODUCTS_INDEX,
      size: 0,
      aggregations: {
        categories: { terms: { field: "category", size: 100 } },
        countries: { terms: { field: "country", size: 100 } },
      },
    });

    productStats = {
      total: result.total,
      categories: result.aggregations.categories?.buckets || [],
      countries: result.aggregations.countries?.buckets || [],
    };
  } catch (error) {
    console.error("Dashboard product analytics failed:", error.message);
  }

  return c.html(
    eta.render("dashboard", {
      title: "Dashboard",
      user: c.get("user"),
      productStats,
    })
  );
}

async function showProducts(c) {
  const query = c.req.query();
  const search = normalizeQueryValue(query.search);
  const category = normalizeQueryValue(query.category);
  const country = normalizeQueryValue(query.country);
  const minPrice = parsePrice(query.minPrice);
  const maxPrice = parsePrice(query.maxPrice);
  const sortBy = PRODUCT_SORT_FIELDS[query.sort] ? query.sort : "name";
  const order = query.order === "desc" ? "desc" : "asc";
  let page = parsePage(query.page);
  const sortField = PRODUCT_SORT_FIELDS[sortBy];
  const filters = [];

  if (category) filters.push({ term: { category } });
  if (country) filters.push({ term: { country } });
  if (minPrice !== undefined || maxPrice !== undefined) {
    filters.push({ range: { price: { ...(minPrice !== undefined ? { gte: minPrice } : {}), ...(maxPrice !== undefined ? { lte: maxPrice } : {}) } } });
  }

  let result;
  let error = "";

  try {
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

    result = await searchDocuments({ ...searchOptions, from: (page - 1) * PRODUCTS_PAGE_SIZE });

    if (page > 1 && result.total > 0 && result.hits.length === 0) {
      page = 1;
      result = await searchDocuments({ ...searchOptions, from: 0 });
    }
  } catch (searchError) {
    console.error("Products search failed:", searchError.message);
    result = { hits: [], total: 0, aggregations: {} };
    error = "Products are temporarily unavailable. Please try again shortly.";
  }

  const products = result.hits.map((hit) => ({ id: hit._id, ...hit._source, image: hit._source.image_url || "" }));
  const totalPages = Math.max(1, Math.ceil(result.total / PRODUCTS_PAGE_SIZE));
  const filtersForUrl = { search, category, country, minPrice: query.minPrice || "", maxPrice: query.maxPrice || "", sort: sortBy, order };
  const pageUrl = (pageNumber) => {
    const url = createProductsUrl(filtersForUrl, "");
    return `${url}${url.includes("?") ? "&" : "?"}page=${pageNumber}`;
  };
  const categories = result.aggregations.categories?.buckets || [];
  const countries = result.aggregations.countries?.buckets || [];

  return c.html(eta.render("products", {
    title: "Products",
    user: c.get("user"),
    products,
    total: result.total,
    categories,
    countries,
    filters: filtersForUrl,
    page,
    totalPages,
    rangeStart: result.total ? (page - 1) * PRODUCTS_PAGE_SIZE + 1 : 0,
    rangeEnd: Math.min(page * PRODUCTS_PAGE_SIZE, result.total),
    previousUrl: page > 1 ? pageUrl(page - 1) : "",
    nextUrl: page < totalPages ? pageUrl(page + 1) : "",
    pageUrl,
    error,
  }));
}

module.exports = { showLanding, showDashboard, showProducts };
