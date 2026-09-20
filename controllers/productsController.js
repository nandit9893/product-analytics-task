const eta = require("../lib/eta");
const { PRODUCTS_PAGE_SIZE, PRODUCT_SORT_FIELDS, searchProducts } = require("../services/productService");
const { normalizeQueryValue, parsePrice, parsePage, createProductsUrl } = require("../utils/queryHelpers");

async function showProducts(c) {
  const query = c.req.query();

  const search = normalizeQueryValue(query.search);
  const category = normalizeQueryValue(query.category);
  const country = normalizeQueryValue(query.country);
  const minPrice = parsePrice(query.minPrice);
  const maxPrice = parsePrice(query.maxPrice);
  const sortBy = PRODUCT_SORT_FIELDS[query.sort] ? query.sort : "name";
  const order = query.order === "desc" ? "desc" : "asc";
  const requestedPage = parsePage(query.page);

  const { result, page, error } = await searchProducts({
    search,
    category,
    country,
    minPrice,
    maxPrice,
    sortBy,
    order,
    page: requestedPage,
  });

  const products = result.hits.map((hit) => ({
    id: hit._id,
    ...hit._source,
    image: hit._source.image_url || "",
  }));

  const totalPages = Math.max(1, Math.ceil(result.total / PRODUCTS_PAGE_SIZE));
  const filtersForUrl = {
    search,
    category,
    country,
    minPrice: query.minPrice || "",
    maxPrice: query.maxPrice || "",
    sort: sortBy,
    order,
  };

  const pageUrl = (pageNumber) => {
    const url = createProductsUrl(filtersForUrl, "");
    return `${url}${url.includes("?") ? "&" : "?"}page=${pageNumber}`;
  };

  const categories = result.aggregations.categories?.buckets || [];
  const countries = result.aggregations.countries?.buckets || [];

  return c.html(
    eta.render("products", {
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
    })
  );
}

module.exports = { showProducts };
