const { Client } = require('@elastic/elasticsearch');
require('dotenv').config();

const client = new Client({
  node: process.env.ELASTICSEARCH_URL || 'http://localhost:9200',
});

async function searchDocuments({
  index,
  query = { match_all: {} },
  filters = [],
  sort = [],
  searchAfter,
  from = 0,
  size = 12,
  aggregations,
}) {
  const must = query ? [query] : [];

  const response = await client.search({
    index,
    query: {
      bool: {
        must,
        filter: filters,
      },
    },
    sort,
    ...(searchAfter ? { search_after: searchAfter } : {}),
    ...(searchAfter ? {} : { from }),
    size,
    track_total_hits: true,
    ...(aggregations ? { aggs: aggregations } : {}),
  });

  return {
    hits: response.hits.hits,
    total: response.hits.total.value,
    aggregations: response.aggregations || {},
  };
}

module.exports = client;
module.exports.searchDocuments = searchDocuments;