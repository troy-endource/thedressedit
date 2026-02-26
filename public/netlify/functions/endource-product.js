// netlify/functions/endource-product.js
// Fetches an endource product page and extracts JSON-LD product data

exports.handler = async (event) => {
  const headers = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Content-Type': 'application/json',
  };

  // Handle CORS preflight
  if (event.httpMethod === 'OPTIONS') {
    return { statusCode: 200, headers, body: '' };
  }

  const url = event.queryStringParameters?.url;

  if (!url || !url.includes('endource.com/product/')) {
    return {
      statusCode: 400,
      headers,
      body: JSON.stringify({ error: 'Please provide a valid endource product URL' }),
    };
  }

  try {
    const response = await fetch(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        'Accept': 'text/html,application/xhtml+xml',
        'Accept-Language': 'en-GB,en;q=0.9',
      },
    });

    if (!response.ok) {
      return {
        statusCode: response.status,
        headers,
        body: JSON.stringify({ error: `Failed to fetch: ${response.status}` }),
      };
    }

    const html = await response.text();

    // Extract JSON-LD script
    const jsonLdMatch = html.match(/<script type="application\/ld\+json">\s*(\{[\s\S]*?\})\s*<\/script>/);

    if (!jsonLdMatch) {
      return {
        statusCode: 404,
        headers,
        body: JSON.stringify({ error: 'No product data found on this page' }),
      };
    }

    const jsonLd = JSON.parse(jsonLdMatch[1]);

    // Extract clean product data
    const product = {
      name: jsonLd.name || '',
      brand: jsonLd.brand?.name || '',
      price: `£${jsonLd.offers?.price || ''}`,
      currency: jsonLd.offers?.priceCurrency || 'GBP',
      image: jsonLd.image || '',
      description: jsonLd.description || '',
      retailer: jsonLd.offers?.seller?.name || jsonLd.brand?.name || '',
      url: url,
      endourceUrl: jsonLd.offers?.url || url,
    };

    return {
      statusCode: 200,
      headers,
      body: JSON.stringify(product),
    };
  } catch (err) {
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({ error: err.message }),
    };
  }
};
