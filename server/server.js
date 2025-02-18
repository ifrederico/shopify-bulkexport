// server/server.js
import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import axios from 'axios';

dotenv.config();

const app = express();

// Middleware
app.use(cors());
app.use(express.json());

// In-memory storage for the connected shop credentials
let storedDomain = null;
let storedApiKey = null;

/**
 * Ensure the shop domain ends with '.myshopify.com'
 */
function getFormattedDomain(domain) {
  return domain.includes('myshopify.com') ? domain : `${domain}.myshopify.com`;
}

/**
 * Utility function to call the Shopify Admin API using stored credentials.
 */
async function shopifyRequest(endpoint, method = 'GET', data = null) {
  if (!storedDomain || !storedApiKey) {
    throw new Error('No store connected');
  }
  const formattedDomain = getFormattedDomain(storedDomain);
  const url = `https://${formattedDomain}/admin/api/2024-01/${endpoint}`;

  const config = {
    method,
    url,
    headers: {
      'X-Shopify-Access-Token': storedApiKey,
      'Content-Type': 'application/json',
    },
  };
  if (data) {
    config.data = data;
  }
  const response = await axios(config);
  return response.data;
}

/**
 * POST /api/connect
 * Validates the provided Shopify credentials by calling /shop.json.
 * On success, stores the credentials in memory.
 *
 * Expected JSON body:
 * { "shopDomain": "your-shop-name", "apiKey": "your-api-key" }
 */
app.post('/api/connect', async (req, res) => {
  try {
    const { shopDomain, apiKey } = req.body;
    if (!shopDomain || !apiKey) {
      return res.status(400).json({ message: 'Missing shopDomain or apiKey' });
    }

    const formattedDomain = getFormattedDomain(shopDomain);
    const url = `https://${formattedDomain}/admin/api/2024-01/shop.json`;
    const response = await axios.get(url, {
      headers: {
        'X-Shopify-Access-Token': apiKey,
        'Content-Type': 'application/json',
      },
    });

    // If the request is successful, store the credentials
    storedDomain = shopDomain;
    storedApiKey = apiKey;

    return res.json({
      success: true,
      message: 'Connected to Shopify successfully',
      shop: response.data.shop,
    });
  } catch (error) {
    console.error('Error in /api/connect:', error.message);
    return res.status(400).json({
      message: error?.response?.data?.errors || error.message,
    });
  }
});

/**
 * GET /api/disconnect
 * Clears the stored shop credentials.
 */
app.get('/api/disconnect', (req, res) => {
  storedDomain = null;
  storedApiKey = null;
  res.json({ success: true, message: 'Disconnected from store' });
});

/**
 * GET /api/status
 * Returns connection status.
 */
app.get('/api/status', (req, res) => {
  if (storedDomain && storedApiKey) {
    return res.json({ connected: true, domain: storedDomain });
  }
  return res.json({ connected: false });
});

/**
 * GET /api/orders
 * Fetch orders from the connected Shopify store.
 * Query parameter: limit (default: 5)
 */
app.get('/api/orders', async (req, res) => {
  try {
    const limit = req.query.limit || 5;
    const data = await shopifyRequest(`orders.json?limit=${limit}`, 'GET');
    return res.json({ success: true, orders: data.orders });
  } catch (error) {
    console.error('Error in /api/orders:', error.message);
    return res.status(400).json({
      message: error?.response?.data?.errors || error.message,
    });
  }
});

/**
 * GET /api/products
 * Fetch products from the connected Shopify store.
 * Query parameter: limit (default: 5)
 */
app.get('/api/products', async (req, res) => {
  try {
    const limit = req.query.limit || 5;
    const data = await shopifyRequest(`products.json?limit=${limit}`, 'GET');
    return res.json({ success: true, products: data.products });
  } catch (error) {
    console.error('Error in /api/products:', error.message);
    return res.status(400).json({
      message: error?.response?.data?.errors || error.message,
    });
  }
});

/**
 * GET /api/customers
 * Fetch customers from the connected Shopify store.
 * Query parameter: limit (default: 5)
 */
app.get('/api/customers', async (req, res) => {
  try {
    const limit = req.query.limit || 5;
    const data = await shopifyRequest(`customers.json?limit=${limit}`, 'GET');
    return res.json({ success: true, customers: data.customers });
  } catch (error) {
    console.error('Error in /api/customers:', error.message);
    return res.status(400).json({
      message: error?.response?.data?.errors || error.message,
    });
  }
});

// Start the server
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server listening on port ${PORT}`);
  console.log('Try POST /api/connect with { "shopDomain": "xxx", "apiKey": "xxx" }');
});