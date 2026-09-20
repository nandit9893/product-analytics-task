// scripts/seed-elasticsearch.js
const client = require('../lib/elasticsearch');

const categories = ['Electronics', 'Machinery', 'Chemicals', 'Automotive', 'Textiles', 'Metal'];
const countries = ['India', 'Germany', 'USA', 'Japan', 'China', 'South Korea'];

const productCatalog = [
  { name: 'Stainless Steel Pipe', category: 'Metal', basePrice: 240 },
  { name: 'Industrial Temperature Sensor', category: 'Electronics', basePrice: 150 },
  { name: 'Hydraulic Piston Pump', category: 'Machinery', basePrice: 620 },
  { name: 'Polymer Resin Drum', category: 'Chemicals', basePrice: 310 },
  { name: 'Ceramic Brake Assembly', category: 'Automotive', basePrice: 180 },
  { name: 'Organic Cotton Yarn Reel', category: 'Textiles', basePrice: 90 },
  { name: 'Digital Multimeter Pro', category: 'Electronics', basePrice: 130 },
  { name: 'Conveyor Roller System', category: 'Machinery', basePrice: 450 },
  { name: 'Industrial Sulfuric Acid Barrel', category: 'Chemicals', basePrice: 220 },
  { name: 'Transmission Planetary Gearbox', category: 'Automotive', basePrice: 580 },
  { name: 'Reinforced Fiber Fabric Roll', category: 'Textiles', basePrice: 110 },
  { name: 'Aluminum Alloy Round Bar', category: 'Metal', basePrice: 190 },
  { name: 'High-Voltage Transformer Core', category: 'Electronics', basePrice: 850 },
  { name: 'Rotary Air Compressor', category: 'Machinery', basePrice: 920 },
  { name: 'Sodium Hydroxide Pellets', category: 'Chemicals', basePrice: 140 },
  { name: 'Fuel Injection Nozzle Kit', category: 'Automotive', basePrice: 270 },
  { name: 'Nylon Monofilament Yarn', category: 'Textiles', basePrice: 80 },
  { name: 'Carbon Steel Heavy Flange', category: 'Metal', basePrice: 340 }
];

async function seedData() {
  const indexName = 'products';

  console.log('--- Step 1: Connecting & Checking Index ---');
  const exists = await client.indices.exists({ index: indexName });
  if (exists) {
    console.log(`Index "${indexName}" already exists. Deleting it to start clean...`);
    await client.indices.delete({ index: indexName });
  }

  console.log('--- Step 2: Creating Index with Schema/Mapping ---');
  await client.indices.create({
    index: indexName,
    body: {
      mappings: {
        properties: {
          id: { type: 'integer' },
          name: {
            type: 'text',
            fields: { keyword: { type: 'keyword' } } // Exact sorting aur fuzzy search dono ke liye
          },
          category: { type: 'keyword' },
          country: { type: 'keyword' },
          price: { type: 'integer' },
          quantity: { type: 'integer' },
          image_url: { type: 'keyword', index: false }
        }
      }
    }
  });

  console.log('--- Step 3: Preparing 200 Documents for Bulk Insertion ---');
  const bulkOperations = [];

  for (let i = 1; i <= 200; i++) {
    const base = productCatalog[i % productCatalog.length];
    const country = countries[i % countries.length];
    
    // Slight random deviation in prices & quantities
    const priceVariance = Math.floor(Math.random() * 80) - 40;
    const price = Math.max(50, base.basePrice + priceVariance);
    const quantity = Math.floor(Math.random() * 1800) + 100;

    const doc = {
      id: 1000 + i,
      name: `${base.name} - Unit ${i}`,
      category: base.category,
      country: country,
      price: price,
      quantity: quantity,
      image_url: "" // Empty as requested
    };

    // Elasticsearch Bulk API format: [Action Metadata, Document Body]
    bulkOperations.push({ index: { _index: indexName, _id: doc.id.toString() } });
    bulkOperations.push(doc);
  }

  console.log('--- Step 4: Executing Bulk Insert into Elasticsearch ---');
  const response = await client.bulk({
    refresh: true, // Turant search ke liye document commit karega
    body: bulkOperations
  });

  if (response.errors) {
    console.error('Errors occurred during insertion!');
  } else {
    console.log(`Successfully seeded ${response.items.length} products into Elasticsearch!`);
  }

  process.exit(0);
}

seedData().catch((err) => {
  console.error('Seeding script failed:', err);
  process.exit(1);
});