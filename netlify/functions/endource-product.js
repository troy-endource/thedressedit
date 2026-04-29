// netlify/functions/endource-product.js
// Fetches product data directly from endource edit page HTML — no per-product requests

const fetch = require('node-fetch');
const cheerio = require('cheerio');

const BYPASS_HEADER = '112dAWX8GIO';

async function fetchPage(url) {
  const response = await fetch(url, {
    headers: {
      'User-Agent': 'Mozilla/5.0 (compatible; TheDressEdit/1.0)',
      'x-skip-end-header': BYPASS_HEADER,
      'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
      'Accept-Language': 'en-GB,en;q=0.9',
    },
    redirect: 'follow',
    timeout: 8000,
  });

  if (!response.ok) {
    throw new Error(`Failed to fetch ${url}: ${response.status} ${response.statusText}`);
  }

  return response.text();
}

// Extract products directly from the edit page HTML
// endource edit pages render product cards with brand, name, price and image in the HTML
function extractProductsFromEditPage(html, limit) {
  const $ = cheerio.load(html);
  const products = [];

  // Each product card contains: brand link, product name link, price, image, buy link
  // Structure: .w-1/2 or .w-1/4 blocks containing product info
  $('a[href*="/product/"]').each(function() {
    const productLink = $(this);
    const href = productLink.attr('href');
    if (!href || !href.includes('/product/')) return;

    const productUrl = href.startsWith('/') ? 'https://www.endource.com' + href : href;

    // Find the parent card container
    const card = productLink.closest('div.p-3');
    if (!card.length) return;

    // Get product name from the product link text
    const name = productLink.text().trim();
    if (!name || name.length < 3) return;

    // Get brand from the brand link (sibling link to /brand/)
    const brandLink = card.find('a[href*="/brand/"]').first();
    const brand = brandLink.text().trim();

    // Get image from the buy link (a[href*="/buy/"]) img inside
    const buyLink = card.find('a[href*="/buy/"]').first();
    const img = buyLink.find('img').first();
    const image = img.attr('src') || '';

    // Get price
    const priceEl = card.find('a[href*="/product/"] + a, .type-lower').last();
    const priceText = card.find('a.truncate.h-4\\.5').first().text().trim();
    // Try to extract price — skip strikethrough (was-price), get current price
    let price = '';
    card.find('a.truncate').each(function() {
      const t = $(this).text().trim();
      const match = t.match(/£[\d,]+(?:\.\d{2})?/);
      if (match && !price) price = match[0];
    });

    // Get retailer from the last link in card (the buy link text)
    const retailerEl = card.find('a[href*="/buy/"]').last();
    const retailer = retailerEl.text().trim().replace(/^\s*[^\s]+\s*/, '').trim();

    // Get buy URL
    const buyHref = buyLink.attr('href') || '';
    const buyUrl = buyHref.startsWith('/') ? 'https://www.endource.com' + buyHref : buyHref;

    if (name && image) {
      products.push({
        name,
        brand,
        image,
        price: price.replace('£', '').trim(),
        currency: 'GBP',
        url: buyUrl || productUrl,
        retailer,
      });
    }
  });

  // Deduplicate by name
  const seen = new Set();
  const unique = products.filter(p => {
    if (seen.has(p.name)) return false;
    seen.add(p.name);
    return true;
  });

  return unique.slice(0, limit);
}

exports.handler = async function(event) {
  const headers = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Content-Type': 'application/json',
    'Cache-Control': 'public, max-age=3600, s-maxage=3600',
  };

  if (event.httpMethod === 'OPTIONS') {
    return { statusCode: 204, headers, body: '' };
  }

  const url = event.queryStringParameters?.url;
  const limit = parseInt(event.queryStringParameters?.limit) || 12;

  if (!url) {
    return {
      statusCode: 400,
      headers,
      body: JSON.stringify({ error: 'Missing url parameter' }),
    };
  }

  try {
    const parsed = new URL(url);
    if (!parsed.hostname.endsWith('endource.com')) {
      return {
        statusCode: 400,
        headers,
        body: JSON.stringify({ error: 'URL must be from endource.com' }),
      };
    }
  } catch (e) {
    return {
      statusCode: 400,
      headers,
      body: JSON.stringify({ error: 'Invalid URL' }),
    };
  }

  try {
    const html = await fetchPage(url);
    const $ = cheerio.load(html);
    const products = extractProductsFromEditPage(html, limit);

    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({
        type: 'edit',
        title: $('h1').first().text().trim() || '',
        products,
        count: products.length,
        source: url,
      }),
    };
  } catch (error) {
    console.error('Error fetching from endource:', error);
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({
        error: 'Failed to fetch product data',
        message: error.message,
        url,
      }),
    };
  }
};