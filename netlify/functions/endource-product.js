// netlify/functions/endource-product.js
// Fetches endource product data — supports both individual products and edit pages

exports.handler = async (event) => {
  const headers = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Content-Type': 'application/json',
  };

  if (event.httpMethod === 'OPTIONS') {
    return { statusCode: 200, headers, body: '' };
  }

  const url = event.queryStringParameters?.url;
  const limit = parseInt(event.queryStringParameters?.limit) || 12;

  if (!url || !url.includes('endource.com')) {
    return {
      statusCode: 400,
      headers,
      body: JSON.stringify({ error: 'Please provide a valid endource URL' }),
    };
  }

  try {
    const response = await fetch(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36',
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8',
        'Accept-Language': 'en-GB,en-US;q=0.9,en;q=0.8',
        'x-skip-end-header': '112dAWX8GIO',
      },
      redirect: 'follow',
    });

    if (!response.ok) {
      return {
        statusCode: response.status,
        headers,
        body: JSON.stringify({ error: 'Endource returned ' + response.status }),
      };
    }

    const html = await response.text();

    // Check if this is an edit/listing page or a single product page
    const isEditPage = url.includes('/edit/') || url.includes('/women/') || url.includes('/men/');

    if (isEditPage) {
      return handleEditPage(html, url, limit, headers);
    } else {
      return handleProductPage(html, url, headers);
    }
  } catch (err) {
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({ error: 'Function error: ' + err.message }),
    };
  }
};

// Handle edit/listing pages — extract multiple products
function handleEditPage(html, sourceUrl, limit, headers) {
  const products = [];

  // Strategy 1: Look for JSON-LD ItemList
  const jsonLdMatches = html.match(/<script\s+type\s*=\s*["']application\/ld\+json["']\s*>([\s\S]*?)<\/script>/gi);

  if (jsonLdMatches) {
    for (const match of jsonLdMatches) {
      try {
        const jsonStr = match.replace(/<script[^>]*>/, '').replace(/<\/script>/, '').trim();
        const data = JSON.parse(jsonStr);

        if (data['@type'] === 'ItemList' && data.itemListElement) {
          for (const item of data.itemListElement) {
            const prod = item.item || item;
            if (prod && prod.name) {
              products.push({
                name: prod.name || '',
                brand: prod.brand?.name || '',
                price: prod.offers?.price ? '\u00a3' + prod.offers.price : (prod.offers?.lowPrice ? '\u00a3' + prod.offers.lowPrice : ''),
                image: (prod.image || '').replace(/\\\//g, '/'),
                retailer: prod.offers?.seller?.name || prod.brand?.name || '',
                url: (prod.url || '').replace(/\\\//g, '/'),
              });
            }
          }
        }

        // Single product in JSON-LD
        if (data['@type'] === 'Product' && data.name) {
          products.push({
            name: data.name || '',
            brand: data.brand?.name || '',
            price: data.offers?.price ? '\u00a3' + data.offers.price : '',
            image: (data.image || '').replace(/\\\//g, '/'),
            retailer: data.offers?.seller?.name || data.brand?.name || '',
            url: (data.url || '').replace(/\\\//g, '/'),
          });
        }
      } catch (e) {
        // Skip unparseable JSON-LD blocks
      }
    }
  }

  // Strategy 2: Parse product cards from HTML if no JSON-LD products found
  if (products.length === 0) {
    // Look for product link patterns with data attributes or structured HTML
    // Pattern: product cards typically have brand, name, price in structured elements
    const productCardRegex = /<a[^>]*href=["'](\/product\/[^"']+)["'][^>]*>[\s\S]*?<\/a>/gi;
    const cardMatches = html.match(productCardRegex) || [];

    for (const card of cardMatches) {
      const hrefMatch = card.match(/href=["'](\/product\/[^"']+)["']/);
      const imgMatch = card.match(/<img[^>]*src=["']([^"']+)["']/);

      if (hrefMatch) {
        // Try to extract text content for brand/name/price
        const textContent = card.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim();
        const priceMatch = textContent.match(/\u00a3([\d,.]+)/);

        products.push({
          name: '',
          brand: '',
          price: priceMatch ? '\u00a3' + priceMatch[1] : '',
          image: imgMatch ? imgMatch[1] : '',
          retailer: '',
          url: 'https://www.endource.com' + hrefMatch[1],
        });
      }
    }
  }

  // Strategy 3: Look for product URLs and fetch individually if we have URLs but no details
  // (This is a fallback — the JSON-LD approach should work for edit pages)

  const limitedProducts = products.slice(0, limit);

  return {
    statusCode: 200,
    headers,
    body: JSON.stringify({
      source: sourceUrl,
      count: limitedProducts.length,
      products: limitedProducts,
    }),
  };
}

// Handle individual product pages
function handleProductPage(html, url, headers) {
  const jsonLdMatch = html.match(/<script\s+type\s*=\s*["']application\/ld\+json["']\s*>([\s\S]*?)<\/script>/i);

  if (!jsonLdMatch) {
    return {
      statusCode: 404,
      headers,
      body: JSON.stringify({ error: 'No product data found on this page' }),
    };
  }

  let jsonLd;
  try {
    const cleanJson = jsonLdMatch[1].trim().replace(/\\\//g, '/');
    jsonLd = JSON.parse(cleanJson);
  } catch (parseErr) {
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({ error: 'Could not parse product data: ' + parseErr.message }),
    };
  }

  const product = {
    name: jsonLd.name || '',
    brand: jsonLd.brand?.name || '',
    price: jsonLd.offers?.price ? '\u00a3' + jsonLd.offers.price : '',
    currency: jsonLd.offers?.priceCurrency || 'GBP',
    image: (jsonLd.image || '').replace(/\\\//g, '/'),
    description: jsonLd.description || '',
    retailer: jsonLd.offers?.seller?.name || jsonLd.brand?.name || '',
    url: url,
    endourceUrl: (jsonLd.offers?.url || url).replace(/\\\//g, '/'),
  };

  return {
    statusCode: 200,
    headers,
    body: JSON.stringify(product),
  };
}
