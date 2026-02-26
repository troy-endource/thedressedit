<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>Product Helper — the dress edit</title>
<link href="https://fonts.googleapis.com/css2?family=EB+Garamond:wght@400;500&family=DM+Sans:wght@300;400;500;600&display=swap" rel="stylesheet">
<style>
  :root {
    --white: #FFFFFF;
    --off-white: #FAFAFA;
    --light-grey: #F2F2F2;
    --border: #E5E5E5;
    --mid-grey: #CCCCCC;
    --text-light: #999999;
    --text-mid: #666666;
    --text-dark: #333333;
    --black: #1A1A1A;
    --green: #2D8A4E;
    --red: #D44638;
    --serif: 'EB Garamond', Georgia, serif;
    --sans: 'DM Sans', -apple-system, sans-serif;
  }
  * { margin: 0; padding: 0; box-sizing: border-box; }
  body { font-family: var(--sans); color: var(--text-dark); background: var(--off-white); }

  .header {
    background: var(--white);
    border-bottom: 1px solid var(--border);
    padding: 20px 32px;
    display: flex;
    align-items: center;
    justify-content: space-between;
  }
  .header h1 {
    font-family: var(--serif);
    font-size: 22px;
    font-weight: 400;
    color: var(--black);
  }
  .header a {
    font-size: 12px;
    color: var(--text-light);
    text-decoration: none;
  }
  .header a:hover { color: var(--black); }

  .container { max-width: 1100px; margin: 0 auto; padding: 32px; }

  .how-to {
    background: var(--white);
    border: 1px solid var(--border);
    border-left: 3px solid var(--black);
    padding: 20px 24px;
    margin-bottom: 24px;
  }
  .how-to h3 {
    font-family: var(--sans);
    font-size: 12px;
    font-weight: 600;
    letter-spacing: 0.06em;
    text-transform: uppercase;
    color: var(--text-light);
    margin-bottom: 10px;
  }
  .how-to ol {
    font-size: 13px;
    font-weight: 300;
    color: var(--text-mid);
    line-height: 1.8;
    padding-left: 18px;
  }
  .how-to strong { font-weight: 500; color: var(--text-dark); }

  .add-section {
    background: var(--white);
    border: 1px solid var(--border);
    padding: 28px;
    margin-bottom: 24px;
  }
  .add-section h2 {
    font-family: var(--sans);
    font-size: 13px;
    font-weight: 600;
    letter-spacing: 0.06em;
    text-transform: uppercase;
    color: var(--text-light);
    margin-bottom: 20px;
  }

  .form-row {
    display: flex;
    gap: 12px;
    margin-bottom: 12px;
  }
  .form-group {
    flex: 1;
    display: flex;
    flex-direction: column;
    gap: 4px;
  }
  .form-group.wide { flex: 2; }
  .form-group label {
    font-size: 10px;
    font-weight: 500;
    letter-spacing: 0.06em;
    text-transform: uppercase;
    color: var(--text-light);
  }
  .form-group input {
    padding: 10px 12px;
    font-family: var(--sans);
    font-size: 13px;
    font-weight: 300;
    border: 1px solid var(--border);
    background: var(--white);
    outline: none;
    color: var(--text-dark);
  }
  .form-group input:focus { border-color: var(--black); }
  .form-group input::placeholder { color: var(--mid-grey); }

  .url-row {
    display: flex;
    gap: 10px;
    margin-bottom: 16px;
    padding-bottom: 16px;
    border-bottom: 1px solid var(--light-grey);
  }
  .url-row input {
    flex: 1;
    padding: 10px 12px;
    font-family: var(--sans);
    font-size: 13px;
    font-weight: 300;
    border: 1px solid var(--border);
    background: var(--white);
    outline: none;
    color: var(--text-dark);
  }
  .url-row input:focus { border-color: var(--black); }
  .url-row input::placeholder { color: var(--mid-grey); }

  .btn {
    padding: 10px 20px;
    font-family: var(--sans);
    font-size: 12px;
    font-weight: 500;
    letter-spacing: 0.04em;
    border: none;
    cursor: pointer;
    transition: opacity 0.2s;
    white-space: nowrap;
  }
  .btn:hover { opacity: 0.8; }
  .btn-primary { background: var(--black); color: var(--white); }
  .btn-secondary { background: var(--light-grey); color: var(--text-dark); }
  .btn-open { background: none; color: var(--text-mid); border: 1px solid var(--border); }
  .btn-open:hover { border-color: var(--black); color: var(--black); }
  .btn-green { background: var(--green); color: var(--white); }
  .btn-row {
    display: flex;
    gap: 10px;
    margin-top: 16px;
  }

  .products-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 16px;
  }
  .products-header h2 {
    font-family: var(--sans);
    font-size: 13px;
    font-weight: 600;
    letter-spacing: 0.06em;
    text-transform: uppercase;
    color: var(--text-light);
  }
  .product-count {
    font-size: 12px;
    color: var(--text-light);
    font-weight: 300;
  }
  .products-grid {
    display: grid;
    grid-template-columns: repeat(4, 1fr);
    gap: 16px;
    margin-bottom: 24px;
  }
  .product-card {
    background: var(--white);
    border: 1px solid var(--border);
    overflow: hidden;
    position: relative;
    transition: border-color 0.2s;
  }
  .product-card:hover { border-color: var(--mid-grey); }
  .product-card-remove {
    position: absolute;
    top: 8px;
    right: 8px;
    width: 24px;
    height: 24px;
    background: var(--white);
    border: 1px solid var(--border);
    border-radius: 50%;
    cursor: pointer;
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 14px;
    color: var(--text-light);
    z-index: 2;
    transition: all 0.2s;
  }
  .product-card-remove:hover { color: var(--red); border-color: var(--red); }
  .product-card-image {
    aspect-ratio: 3/4;
    background: var(--light-grey);
    overflow: hidden;
    display: flex;
    align-items: center;
    justify-content: center;
  }
  .product-card-image img {
    width: 100%;
    height: 100%;
    object-fit: cover;
    object-position: top center;
  }
  .product-card-image .no-image {
    font-size: 11px;
    color: var(--mid-grey);
    text-align: center;
    line-height: 1.4;
  }
  .product-card-info { padding: 12px; }
  .product-card-info .brand {
    font-size: 10px;
    font-weight: 500;
    letter-spacing: 0.06em;
    text-transform: uppercase;
    color: var(--text-light);
    margin-bottom: 3px;
  }
  .product-card-info .name {
    font-size: 13px;
    font-weight: 400;
    color: var(--black);
    line-height: 1.3;
    margin-bottom: 5px;
  }
  .product-card-info .price {
    font-size: 13px;
    font-weight: 500;
    color: var(--black);
  }
  .product-card-info .retailer {
    font-size: 11px;
    color: var(--text-light);
    font-weight: 300;
  }
  .edit-toggle {
    font-size: 10px;
    color: var(--text-light);
    cursor: pointer;
    text-align: right;
    padding: 4px 12px 8px;
  }
  .edit-toggle:hover { color: var(--black); }
  .product-card-edit { padding: 0 12px 12px; }
  .product-card-edit input {
    width: 100%;
    padding: 6px 8px;
    font-family: var(--sans);
    font-size: 11px;
    border: 1px solid var(--border);
    outline: none;
    margin-bottom: 4px;
    color: var(--text-dark);
  }
  .product-card-edit input:focus { border-color: var(--black); }
  .product-card-edit .field-label {
    font-size: 9px;
    text-transform: uppercase;
    letter-spacing: 0.05em;
    color: var(--mid-grey);
    margin-top: 4px;
  }

  .output-section {
    background: var(--white);
    border: 1px solid var(--border);
    padding: 28px;
  }
  .output-section h2 {
    font-family: var(--sans);
    font-size: 13px;
    font-weight: 600;
    letter-spacing: 0.06em;
    text-transform: uppercase;
    color: var(--text-light);
    margin-bottom: 16px;
  }
  .output-tabs {
    display: flex;
    gap: 0;
    margin-bottom: 16px;
    border-bottom: 1px solid var(--border);
  }
  .output-tab {
    padding: 10px 20px;
    font-size: 12px;
    font-weight: 500;
    color: var(--text-light);
    cursor: pointer;
    border-bottom: 2px solid transparent;
    transition: all 0.2s;
  }
  .output-tab.active { color: var(--black); border-bottom-color: var(--black); }
  .output-tab:hover { color: var(--text-dark); }
  textarea {
    width: 100%;
    min-height: 300px;
    padding: 16px;
    font-family: 'SF Mono', 'Monaco', 'Inconsolata', monospace;
    font-size: 12px;
    line-height: 1.6;
    border: 1px solid var(--border);
    background: var(--off-white);
    color: var(--text-dark);
    resize: vertical;
    outline: none;
  }
  .copy-bar {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-top: 12px;
  }
  .copy-status { font-size: 12px; color: var(--green); }

  .empty-state {
    text-align: center;
    padding: 48px 20px;
    color: var(--text-light);
    font-size: 13px;
    font-weight: 300;
    border: 1px dashed var(--border);
    margin-bottom: 24px;
  }

  @media (max-width: 900px) {
    .products-grid { grid-template-columns: repeat(2, 1fr); }
    .form-row { flex-direction: column; }
    .container { padding: 20px; }
  }
  @media (max-width: 500px) {
    .products-grid { grid-template-columns: 1fr; }
  }
</style>
</head>
<body>

<div class="header">
  <h1>the dress edit &#8212; product helper</h1>
  <a href="/admin/">&#8592; Back to CMS</a>
</div>

<div class="container">

  <div class="how-to">
    <h3>How to use</h3>
    <ol>
      <li>Paste an <strong>endource product URL</strong> below and click <strong>Open</strong> to view the product page</li>
      <li>Copy the <strong>brand, name, price, retailer</strong> and <strong>image URL</strong> from the page into the form</li>
      <li>Click <strong>Add Product</strong> &#8212; repeat for each product</li>
      <li>Copy the <strong>YAML / JSON output</strong> below and paste into your article markdown</li>
    </ol>
  </div>

  <div class="add-section">
    <h2>Add a Product</h2>

    <div class="url-row">
      <input type="text" id="productUrl" placeholder="Paste endource product URL to open it..." />
      <button class="btn btn-open" onclick="openUrl()">Open &#8599;</button>
    </div>

    <div class="form-row">
      <div class="form-group">
        <label>Brand</label>
        <input type="text" id="fieldBrand" placeholder="e.g. COS" />
      </div>
      <div class="form-group wide">
        <label>Product Name</label>
        <input type="text" id="fieldName" placeholder="e.g. Pleated Midi Dress" />
      </div>
    </div>

    <div class="form-row">
      <div class="form-group">
        <label>Price</label>
        <input type="text" id="fieldPrice" placeholder="e.g. &#163;135" />
      </div>
      <div class="form-group">
        <label>Retailer</label>
        <input type="text" id="fieldRetailer" placeholder="e.g. COS" />
      </div>
    </div>

    <div class="form-row">
      <div class="form-group wide">
        <label>Image URL</label>
        <input type="text" id="fieldImage" placeholder="Right-click product image &#8594; Copy Image Address" />
      </div>
    </div>

    <div class="form-row">
      <div class="form-group wide">
        <label>Affiliate / Product URL</label>
        <input type="text" id="fieldAffUrl" placeholder="The endource product link (auto-filled from above)" />
      </div>
    </div>

    <div class="btn-row">
      <button class="btn btn-green" onclick="addProduct()">Add Product</button>
      <button class="btn btn-secondary" onclick="clearForm()">Clear Form</button>
    </div>
  </div>

  <div id="productsArea">
    <div class="empty-state" id="emptyState">No products added yet. Use the form above to add your first product.</div>
  </div>

  <div id="productsHeader" class="products-header" style="display:none;">
    <h2>Products <span id="productCount" class="product-count"></span></h2>
    <button class="btn btn-secondary" onclick="clearAll()">Clear All</button>
  </div>
  <div id="productsGrid" class="products-grid" style="display:none;"></div>

  <div id="outputSection" class="output-section" style="display:none;">
    <h2>Generated Output</h2>
    <div class="output-tabs">
      <div class="output-tab active" onclick="switchTab('yaml', this)">YAML (for markdown)</div>
      <div class="output-tab" onclick="switchTab('json', this)">JSON</div>
      <div class="output-tab" onclick="switchTab('cms', this)">CMS Fields</div>
    </div>
    <textarea id="outputArea" readonly></textarea>
    <div class="copy-bar">
      <span id="copyStatus" class="copy-status"></span>
      <button class="btn btn-primary" onclick="copyOutput()">Copy to Clipboard</button>
    </div>
  </div>

</div>

<script>
  let products = [];
  let activeTab = 'yaml';

  function openUrl() {
    const url = document.getElementById('productUrl').value.trim();
    if (!url) return;
    window.open(url, '_blank');
    document.getElementById('fieldAffUrl').value = url;
  }

  function addProduct() {
    const brand = document.getElementById('fieldBrand').value.trim();
    const name = document.getElementById('fieldName').value.trim();
    const price = document.getElementById('fieldPrice').value.trim();
    const retailer = document.getElementById('fieldRetailer').value.trim();
    const image = document.getElementById('fieldImage').value.trim();
    const url = document.getElementById('fieldAffUrl').value.trim() || document.getElementById('productUrl').value.trim();

    if (!brand && !name) {
      document.getElementById('fieldBrand').style.borderColor = '#D44638';
      document.getElementById('fieldName').style.borderColor = '#D44638';
      setTimeout(function() {
        document.getElementById('fieldBrand').style.borderColor = '';
        document.getElementById('fieldName').style.borderColor = '';
      }, 1500);
      return;
    }

    products.push({
      brand: brand,
      name: name,
      price: price,
      retailer: retailer || brand,
      image: image,
      url: url,
      _editing: false
    });

    clearForm();
    renderProducts();
    updateOutput();
  }

  function clearForm() {
    document.getElementById('productUrl').value = '';
    document.getElementById('fieldBrand').value = '';
    document.getElementById('fieldName').value = '';
    document.getElementById('fieldPrice').value = '';
    document.getElementById('fieldRetailer').value = '';
    document.getElementById('fieldImage').value = '';
    document.getElementById('fieldAffUrl').value = '';
  }

  function clearAll() {
    if (products.length > 0 && !confirm('Remove all products?')) return;
    products = [];
    renderProducts();
    updateOutput();
  }

  function removeProduct(index) {
    products.splice(index, 1);
    renderProducts();
    updateOutput();
  }

  function toggleEdit(index) {
    products[index]._editing = !products[index]._editing;
    renderProducts();
  }

  function updateField(index, field, value) {
    products[index][field] = value;
    updateOutput();
  }

  function esc(str) {
    if (!str) return '';
    var d = document.createElement('div');
    d.textContent = str;
    return d.innerHTML;
  }

  function escAttr(str) {
    if (!str) return '';
    return str.replace(/&/g,'&amp;').replace(/"/g,'&quot;').replace(/</g,'&lt;').replace(/>/g,'&gt;');
  }

  function renderProducts() {
    var grid = document.getElementById('productsGrid');
    var header = document.getElementById('productsHeader');
    var empty = document.getElementById('emptyState');
    var count = document.getElementById('productCount');

    if (products.length === 0) {
      grid.style.display = 'none';
      header.style.display = 'none';
      empty.style.display = 'block';
      return;
    }

    empty.style.display = 'none';
    header.style.display = 'flex';
    grid.style.display = 'grid';
    count.textContent = '(' + products.length + ')';

    grid.innerHTML = products.map(function(p, i) {
      return '<div class="product-card">' +
        '<div class="product-card-remove" onclick="removeProduct(' + i + ')">&times;</div>' +
        '<div class="product-card-image">' +
          (p.image
            ? '<img src="' + escAttr(p.image) + '" alt="' + escAttr(p.name) + '" onerror="this.parentElement.innerHTML=\'<div class=no-image>Image failed<br>to load</div>\'" />'
            : '<div class="no-image">No image<br>provided</div>') +
        '</div>' +
        '<div class="product-card-info">' +
          '<p class="brand">' + esc(p.brand) + '</p>' +
          '<p class="name">' + esc(p.name) + '</p>' +
          '<span class="price">' + esc(p.price) + '</span>' +
          (p.retailer ? '<span class="retailer"> &middot; ' + esc(p.retailer) + '</span>' : '') +
        '</div>' +
        '<div class="edit-toggle" onclick="toggleEdit(' + i + ')">' + (p._editing ? '&#9650; Close' : '&#9660; Edit fields') + '</div>' +
        (p._editing ?
          '<div class="product-card-edit">' +
            '<span class="field-label">Brand</span>' +
            '<input value="' + escAttr(p.brand) + '" onchange="updateField(' + i + ',\'brand\',this.value)" />' +
            '<span class="field-label">Name</span>' +
            '<input value="' + escAttr(p.name) + '" onchange="updateField(' + i + ',\'name\',this.value)" />' +
            '<span class="field-label">Price</span>' +
            '<input value="' + escAttr(p.price) + '" onchange="updateField(' + i + ',\'price\',this.value)" />' +
            '<span class="field-label">Retailer</span>' +
            '<input value="' + escAttr(p.retailer) + '" onchange="updateField(' + i + ',\'retailer\',this.value)" />' +
            '<span class="field-label">Image URL</span>' +
            '<input value="' + escAttr(p.image) + '" onchange="updateField(' + i + ',\'image\',this.value)" />' +
            '<span class="field-label">Product URL</span>' +
            '<input value="' + escAttr(p.url) + '" onchange="updateField(' + i + ',\'url\',this.value)" />' +
          '</div>'
        : '') +
      '</div>';
    }).join('');
  }

  function switchTab(tab, el) {
    activeTab = tab;
    document.querySelectorAll('.output-tab').forEach(function(t) { t.classList.remove('active'); });
    el.classList.add('active');
    updateOutput();
  }

  function updateOutput() {
    var section = document.getElementById('outputSection');
    var area = document.getElementById('outputArea');

    if (products.length === 0) {
      section.style.display = 'none';
      return;
    }

    section.style.display = 'block';

    if (activeTab === 'yaml') {
      var yaml = products.map(function(p) {
        return '      - brand: "' + p.brand + '"\n' +
               '        name: "' + p.name + '"\n' +
               '        price: "' + p.price + '"\n' +
               '        retailer: "' + p.retailer + '"\n' +
               '        image: "' + p.image + '"\n' +
               '        url: "' + p.url + '"';
      }).join('\n');
      area.value = '    products:\n' + yaml;
    } else if (activeTab === 'json') {
      var clean = products.map(function(p) {
        var copy = Object.assign({}, p);
        delete copy._editing;
        return copy;
      });
      area.value = JSON.stringify(clean, null, 2);
    } else {
      area.value = products.map(function(p, i) {
        return '--- Product ' + (i + 1) + ' ---\nBrand: ' + p.brand + '\nName: ' + p.name + '\nPrice: ' + p.price + '\nRetailer: ' + p.retailer + '\nImage URL: ' + p.image + '\nProduct URL: ' + p.url;
      }).join('\n\n');
    }
  }

  function copyOutput() {
    var area = document.getElementById('outputArea');
    navigator.clipboard.writeText(area.value).then(function() {
      document.getElementById('copyStatus').textContent = 'Copied!';
      setTimeout(function() { document.getElementById('copyStatus').textContent = ''; }, 2000);
    });
  }

  document.addEventListener('keydown', function(e) {
    if (e.key === 'Enter' && e.target.id === 'productUrl') {
      openUrl();
    }
    if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) {
      addProduct();
    }
  });
</script>

</body>
</html>
