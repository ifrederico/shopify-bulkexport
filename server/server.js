// server/server.js
import express from 'express';
import cors from 'cors';
import axios from 'axios';
import dotenv from 'dotenv';
import crypto from 'crypto';
import path from 'path';
import { fileURLToPath } from 'url';

dotenv.config();

const app = express();
app.use(cors({
  origin: "*",  // Allow all domains (change in production)
  methods: "GET,POST,PUT,DELETE",
  allowedHeaders: "Content-Type,Authorization"
}));
app.use(express.json());

const { SHOPIFY_API_KEY, SHOPIFY_API_SECRET, SCOPES, HOST, PORT } = process.env;

// Fix __dirname in ES6 modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

/**
 * Verify the HMAC signature provided by Shopify in the OAuth callback.
 */
function verifyHmac(query) {
  const { hmac, signature, ...params } = query;
  const message = Object.keys(params).sort().map(key => `${key}=${params[key]}`).join('&');
  const generatedHmac = crypto.createHmac('sha256', SHOPIFY_API_SECRET).update(message).digest('hex');
  
  const providedHmacBuffer = Buffer.from(hmac, 'utf-8');
  const generatedHmacBuffer = Buffer.from(generatedHmac, 'utf-8');

  if (providedHmacBuffer.length !== generatedHmacBuffer.length) {
    return false;
  }

  return crypto.timingSafeEqual(generatedHmacBuffer, providedHmacBuffer);
}

/**
 * GET /auth - Initiates the OAuth flow.
 */
app.get('/auth', (req, res) => {
  const shop = req.query.shop;
  if (!shop) {
    return res.status(400).send('Missing shop parameter. Use ?shop=your-shop.myshopify.com');
  }

  const state = crypto.randomBytes(16).toString('hex');
  const redirectUri = `${HOST}/shopify-bulkexport/auth/callback`;
  const installUrl = `https://${shop}/admin/oauth/authorize?client_id=${SHOPIFY_API_KEY}&scope=${SCOPES}&state=${state}&redirect_uri=${redirectUri}`;
  
  res.redirect(installUrl);
});

/**
 * GET /auth/callback - Handles the OAuth callback from Shopify.
 */
app.get('/auth/callback', async (req, res) => {
  const { shop, hmac, code, state, timestamp } = req.query;

  if (!shop || !hmac || !code || !state || !timestamp) {
    return res.status(400).send('Required parameters missing');
  }

  if (!verifyHmac(req.query)) {
    return res.status(400).send('HMAC validation failed');
  }

  const accessTokenRequestUrl = `https://${shop}/admin/oauth/access_token`;
  const payload = {
    client_id: SHOPIFY_API_KEY,
    client_secret: SHOPIFY_API_SECRET,
    code,
  };

  try {
    const response = await axios.post(accessTokenRequestUrl, payload);
    const accessToken = response.data.access_token;

    console.log(`Access Token for ${shop}:`, accessToken);
    res.redirect(`${HOST}/?shop=${shop}`);
  } catch (error) {
    console.error('Error obtaining access token:', error.response ? error.response.data : error.message);
    res.status(500).send('Error obtaining access token');
  }
});

// ✅ Serve the React frontend from the /dist folder
app.use("/shopify-bulkexport", express.static(path.join(__dirname, "../dist")));

app.get("/shopify-bulkexport/*", (req, res) => {
  res.sendFile(path.join(__dirname, "../dist", "index.html"));
});

app.listen(PORT, "0.0.0.0", () => {
  console.log(`OAuth server listening on http://0.0.0.0:${PORT}`);
});