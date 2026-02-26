// netlify/functions/endource-product.js
// Fetches an endource product page and extracts JSON-LD product data

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
        body: JSON.stringify({ error: `Endource returned ${response.status}. Try again or check the URL.` }),
      };
    }

    const html = await response.text();

    // Extract JSON-LD script
    const jsonLdMatch = html.match(/<script\s+type\s*=\s*["']application\/ld\+json["']\s*>([\s\S]*?)<\/script>/i);

    if (!jsonLdMatch) {
      return {
        statusCode: 404,
        headers,
        body: JSON.stringify({ error: 'No product data found on this page. Is this a valid product URL?' }),
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
        body: JSON.stringify({ error: 'Found product data but could not parse it: ' + parseErr.message }),
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
  } catch (err) {
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({ error: 'Function error: ' + err.message }),
    };
  }
};
