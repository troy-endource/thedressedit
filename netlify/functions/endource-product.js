// netlify/functions/endource-product.js
// Fetches product data from endource.com pages using the Cloudflare bypass header

const fetch = require('node-fetch');
const cheerio = require('cheerio');

const BYPASS_HEADER = '112dAWX8GIO';

// Known endource brands for slug-based extraction
const KNOWN_BRANDS = [
  'zimmermann','rixo','ganni','cos','self-portrait','reformation',
  'nobody-s-child','ghost','hobbs','whistles','saloni','isabel-marant',
  'me-em','boden','claudie-pierlot','nina-ricci','patou','albaray',
  'markarian','doen','phase-eight','sea','arket','reiss','hush','mango',
  'karen-millen','acne-studios','acne','by-malene-birger','staud','toteme',
  'magda-butrym','jil-sander','monica-vinader','sandro','allsaints',
  'barbour','baukjen','khaite','lemaire','radley','zimmermann',
  'joseph','teoria','faithfull-the-brand','faithfull','ba-sh','ba&sh',
];

function brandFromSlug(url) {
  try {
    const slug = url.split('/product/')[1]?.split('/')[0] || '';
    const matched = KNOWN_BRANDS.find(b => slug.startsWith(b));
    if (!matched) return '';
    return matched
      .split('-')
      .map(w => w.charAt(0).toUpperCase() + w.slice(1))
      .join(' ')
      .replace('Ba Sh', 'Ba&sh')
      .replace('Me Em', 'ME+EM')
      .replace('Cos', 'COS');
  } catch (e) {
    return '';
  }
}

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
      if (text) scripts.push(JSON.parse(text));
    } catch (e) {}
  });
  return scripts;
}

function extractProductFromPage(html, url) {
  const $ = cheerio.load(html);
  const jsonLdScripts = extractJsonLd(html);

  // Try JSON-LD Product schema first
  for (const script of jsonLdScripts) {
    let productData = null;
    if (script['@type'] === 'Product') productData = script;
    if (Array.isArray(script)) productData = script.find(s => s['@type'] === 'Product');
    if (script['@graph']) productData = script['@graph'].find(s => s['@type'] === 'Product');

    if (productData) {
      const offers = productData.offers || {};
      const offerData = Array.isArray(offers) ? offers[0] : offers;
      let price = offerData.price || offerData.lowPrice || '';
      let currency = offerData.priceCurrency || 'GBP';

      return {
        name: productData.name || '',
        brand: productData.brand?.name || (typeof productData.brand === 'string' ? productData.brand : '') || brandFromSlug(url),
        description: productData.description || '',
        image: Array.isArray(productData.image) ? productData.image[0] : (productData.image || ''),
        price: price,
        currency: currency,
        url: productData.url || url,
        retailer: offerData.seller?.name || '',
      };
    }
  }

  // Fallback: scrape from HTML
  // Try to get price from common endource price selectors
  const priceSelectors = [
    '[class*="price"]:not([class*="was"]):not([class*="old"])',
    '[data-price]',
    '.product-price',
    '.price',
  ];
  
  let price = '';
  for (const sel of priceSelectors) {
    const el = $(sel).first();
    if (el.length) {
      const text = el.text().trim();
      const match = text.match(/[£$€][\d,]+(?:\.\d{2})?/);
      if (match) { price = match[0]; break; }
    }
  }

  // Try data attributes for price
  if (!price) {
    $('[data-price], [data-product-price]').each((i, el) => {
      const val = $(el).attr('data-price') || $(el).attr('data-product-price');
      if (val && !price) price = val;
    });
  }

  const name = $('h1').first().text().trim() ||
               $('meta[property="og:title"]').attr('content') || '';
  const image = $('meta[property="og:image"]').attr('content') ||
                $('img[class*="product"]').first().attr('src') || '';

  // Extract brand from meta or fallback to slug
  const brandMeta = $('meta[property="product:brand"]').attr('content') || '';
  const brand = brandMeta || brandFromSlug(url);

  // Try to get retailer name
  const retailer = $('meta[property="og:site_name"]').attr('content') || '';

  return {
    name: name.replace(/\s+/g, ' ').trim(),
    brand,
    description: $('meta[property="og:description"]').attr('content') || '',
    image,
    price,
    currency: $('meta[property="product:price:currency"]').attr('content') || 'GBP',
    url,
    retailer,
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
      if (href.includes('endource.com/product/')) urls.add(href);
    }
  });

  return [...urls];
}

async function handleEditPage(html, url, limit) {
  const $ = cheerio.load(html);
  const productUrls = extractProductUrlsFromEditPage(html, url);

  if (productUrls.length === 0) {
    return {
      type: 'edit',
      title: $('h1').first().text().trim() || '',
      products: [],
      count: 0,
      source: url,
      error: 'No product URLs found on edit page',
    };
  }

  const uniqueUrls = [...new Set(productUrls)].slice(0, limit);
  const BATCH_SIZE = 6;
  const products = [];

  for (let i = 0; i < uniqueUrls.length; i += BATCH_SIZE) {
    const batch = uniqueUrls.slice(i, i + BATCH_SIZE);
    const results = await Promise.allSettled(
      batch.map(async (productUrl) => {
        try {
          const productHtml = await fetchPage(productUrl);
          const product = extractProductFromPage(productHtml, productUrl);
          // Always ensure brand is populated from slug if not found in page
          if (!product.brand) product.brand = brandFromSlug(productUrl);
          return product;
        } catch (err) {
          // Even on fetch error, return brand from slug
          return {
            name: '',
            brand: brandFromSlug(productUrl),
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
    title: $('h1').first().text().trim() || '',
    products,
    count: products.length,
    source: url,
  };
}

function handleProductPage(html, url) {
  const product = extractProductFromPage(html, url);
  if (!product.brand) product.brand = brandFromSlug(url);
  return { type: 'product', product };
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
    const isEditPage = url.includes('/edit/') || url.includes('/women/') || url.includes('/men/');

    let result;
    if (isEditPage) {
      result = await handleEditPage(html, url, limit);
    } else {
      result = handleProductPage(html, url);
    }

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
