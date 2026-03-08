// netlify/functions/endource-product.js
// Fetches product data from endource.com pages using the Cloudflare bypass header
// Handles both individual product pages AND edit pages (collections)
// For edit pages: scrapes product URLs, then fetches each product page for full details

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
    timeout: 10000,
  });

  if (!response.ok) {
    throw new Error(`Failed to fetch ${url}: ${response.status} ${response.statusText}`);
  }

  return response.text();
}

function extractJsonLd(html) {
  const $ = cheerio.load(html);
  const scripts = [];

  $('script[type="application/ld+json"]').each((i, el) => {
    try {
      const text = $(el).html();
      if (text) {
        scripts.push(JSON.parse(text));
      }
    } catch (e) {
      // skip invalid JSON-LD
    }
  });

  return scripts;
}

function extractProductFromPage(html, url) {
  const $ = cheerio.load(html);
  const jsonLdScripts = extractJsonLd(html);

  // Try JSON-LD Product schema first
  for (const script of jsonLdScripts) {
    let productData = null;

    if (script['@type'] === 'Product') {
      productData = script;
    }
    if (Array.isArray(script)) {
      productData = script.find(s => s['@type'] === 'Product');
    }
    if (script['@graph']) {
      productData = script['@graph'].find(s => s['@type'] === 'Product');
    }

    if (productData) {
      const offers = productData.offers || {};
      const offerData = Array.isArray(offers) ? offers[0] : offers;

      let price = offerData.price || offerData.lowPrice || '';
      let currency = offerData.priceCurrency || 'GBP';

      if (offerData.offers && Array.isArray(offerData.offers)) {
        const firstOffer = offerData.offers[0];
        price = price || firstOffer?.price || firstOffer?.lowPrice || '';
        currency = currency || firstOffer?.priceCurrency || 'GBP';
      }

      return {
        name: productData.name || '',
        brand: productData.brand?.name || (typeof productData.brand === 'string' ? productData.brand : '') || '',
        description: productData.description || '',
        image: Array.isArray(productData.image) ? productData.image[0] : (productData.image || ''),
        price: price,
        currency: currency,
        url: productData.url || url,
        retailer: offerData.seller?.name || '',
      };
    }
  }

  // Fallback: scrape from meta tags and common selectors
  const name = $('h1').first().text().trim() ||
               $('meta[property="og:title"]').attr('content') || '';
  const brand = $('[class*="brand" i]').first().text().trim() ||
                $('meta[property="product:brand"]').attr('content') || '';
  const price = $('[class*="price" i]').first().text().trim() ||
                $('meta[property="product:price:amount"]').attr('content') || '';
  const image = $('meta[property="og:image"]').attr('content') ||
                $('img[class*="product" i]').first().attr('src') || '';
  const description = $('meta[property="og:description"]').attr('content') || '';

  return {
    name: name.replace(/\s+/g, ' ').trim(),
    brand,
    description,
    image,
    price,
    currency: $('meta[property="product:price:currency"]').attr('content') || 'GBP',
    url,
    retailer: '',
  };
}

function extractProductUrlsFromEditPage(html, editUrl) {
  const $ = cheerio.load(html);
  const urls = new Set();

  // Method 1: JSON-LD ItemList
  const jsonLdScripts = extractJsonLd(html);
  for (const script of jsonLdScripts) {
    let itemList = null;
    if (script['@type'] === 'ItemList') itemList = script;
    if (Array.isArray(script)) itemList = script.find(s => s['@type'] === 'ItemList');
    if (script['@graph']) itemList = script['@graph'].find(s => s['@type'] === 'ItemList');

    if (itemList?.itemListElement) {
      for (const item of itemList.itemListElement) {
        const itemUrl = item.url || item.item?.url;
        if (itemUrl) urls.add(itemUrl);
      }
    }
  }

  // Method 2: Links to product pages
  $('a[href*="/product/"]').each((i, el) => {
    let href = $(el).attr('href');
    if (href) {
      if (href.startsWith('/')) href = `https://www.endource.com${href}`;
      if (href.includes('endource.com/product/')) {
        urls.add(href);
      }
    }
  });

  return [...urls];
}

async function handleEditPage(html, url) {
  const $ = cheerio.load(html);

  const productUrls = extractProductUrlsFromEditPage(html, url);

  if (productUrls.length === 0) {
    return {
      type: 'edit',
      title: $('h1').first().text().trim() || 'New In This Week',
      products: [],
      count: 0,
      source: url,
      error: 'No product URLs found on edit page',
    };
  }

  const uniqueUrls = [...new Set(productUrls)];

  const BATCH_SIZE = 6;
  const products = [];

  for (let i = 0; i < uniqueUrls.length; i += BATCH_SIZE) {
    const batch = uniqueUrls.slice(i, i + BATCH_SIZE);
    const results = await Promise.allSettled(
      batch.map(async (productUrl) => {
        try {
          const productHtml = await fetchPage(productUrl);
          return extractProductFromPage(productHtml, productUrl);
        } catch (err) {
          console.error(`Failed to fetch product: ${productUrl}`, err.message);
          return {
            name: '',
            brand: '',
            description: '',
            image: '',
            price: '',
            currency: 'GBP',
            url: productUrl,
            retailer: '',
            fetchError: err.message,
          };
        }
      })
    );

    for (const result of results) {
      if (result.status === 'fulfilled' && result.value) {
        products.push(result.value);
      }
    }
  }

  return {
    type: 'edit',
    title: $('h1').first().text().trim() || 'New In This Week',
    products,
    count: products.length,
    source: url,
  };
}

function handleProductPage(html, url) {
  const product = extractProductFromPage(html, url);
  return {
    type: 'product',
    product,
  };
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

  // Validate URL is from endource.com
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
    const isEditPage = url.includes('/edit/') || url.includes('/women/') || url.includes('/men/');

    let result;
    if (isEditPage) {
      result = await handleEditPage(html, url);
    } else {
      result = handleProductPage(html, url);
    }

    // Add debug info
    const jsonLdScripts = extractJsonLd(html);
    result.debug = {
      htmlLength: html.length,
      jsonLdCount: jsonLdScripts.length,
      jsonLdTypes: jsonLdScripts.map(s => s['@type'] || (Array.isArray(s) ? 'Array' : 'unknown')),
      isEditPage,
      timestamp: new Date().toISOString(),
    };

    return {
      statusCode: 200,
      headers,
      body: JSON.stringify(result),
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