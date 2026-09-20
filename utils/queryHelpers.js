function normalizeQueryValue(value) {
  if (!value) return "";

  try {
    return decodeURIComponent(String(value).replace(/\+/g, " ")).trim();
  } catch {
    return String(value).trim();
  }
}

function parsePrice(value) {
  const price = Number(value);
  return Number.isFinite(price) && price >= 0 ? price : undefined;
}

function parsePage(value) {
  const page = Number.parseInt(value, 10);
  return Number.isInteger(page) && page > 0 ? Math.min(page, 1000) : 1;
}

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

module.exports = {
  normalizeQueryValue,
  parsePrice,
  parsePage,
  decodeCursor,
  encodeCursor,
  createProductsUrl,
};
