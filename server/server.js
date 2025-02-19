// server/server.js
import express from 'express';
import cors from 'cors';
import axios from 'axios';
import dotenv from 'dotenv';
import crypto from 'crypto';

dotenv.config();

const app = express();
app.use(cors());
app.use(express.json());

const { SHOPIFY_API_KEY, SHOPIFY_API_SECRET, SCOPES, HOST, PORT } = process.env;

/**
 * Verify the HMAC signature provided by Shopify in the OAuth callback.
 * This function removes the `hmac` and `signature` parameters from the query,
 * sorts the remaining parameters lexicographically, concatenates them into a
 * query string, and then generates an HMAC using SHA256 and your Shopify API secret.
 *
 * @param {object} query - The query parameters from the request.
 * @returns {boolean} - True if the HMAC is valid, false otherwise.
 */
function verifyHmac(query) {
  // Extract hmac and signature, then retain the remaining parameters.
  const { hmac, signature, ...params } = query;
  
  // Create the message by sorting the keys and concatenating as "key=value" pairs.
  const message = Object.keys(params)
    .sort()
    .map(key => `${key}=${params[key]}`)
    .join('&');
  
  // Generate a hash using your Shopify API secret.
  const generatedHmac = crypto
    .createHmac('sha256', SHOPIFY_API_SECRET)
    .update(message)
    .digest('hex');
  
  // Compare the generated hash with the provided hmac in a timing-safe manner.
  const providedHmacBuffer = Buffer.from(hmac, 'utf-8');
  const generatedHmacBuffer = Buffer.from(generatedHmac, 'utf-8');
  
  // timingSafeEqual throws an error if buffers are not the same length,
  // so ensure they are before comparing.
  if (providedHmacBuffer.length !== generatedHmacBuffer.length) {
    return false;
  }
  
  return crypto.timingSafeEqual(generatedHmacBuffer, providedHmacBuffer);
}

/**
 * GET /auth
 *
 * Initiates the OAuth flow by redirecting the merchant to Shopify's authorization URL.
 * The shop parameter must be provided in the query string (e.g., ?shop=your-shop.myshopify.com).
 */
app.get('/auth', (req, res) => {
  const shop = req.query.shop;
  if (!shop) {
    return res.status(400).send('Missing shop parameter. Use ?shop=your-shop.myshopify.com');
  }

  // Generate a random state string for CSRF protection.
  // In production, store this state in a session or database to verify later.
  const state = crypto.randomBytes(16).toString('hex');
  const redirectUri = `${HOST}/auth/callback`;
  
  // Build the Shopify install URL.
  const installUrl = `https://${shop}/admin/oauth/authorize?client_id=${SHOPIFY_API_KEY}&scope=${SCOPES}&state=${state}&redirect_uri=${redirectUri}`;
  
  res.redirect(installUrl);
});

/**
 * GET /auth/callback
 *
 * Shopify redirects to this endpoint after the merchant approves (or denies) the app.
 * This endpoint validates the request using full HMAC verification and then exchanges
 * the temporary code for a permanent access token.
 */
app.get('/auth/callback', async (req, res) => {
  const { shop, hmac, code, state, timestamp } = req.query;
  
  // Ensure all required parameters are present.
  if (!shop || !hmac || !code || !state || !timestamp) {
    return res.status(400).send('Required parameters missing');
  }
  
  // Verify the HMAC signature.
  if (!verifyHmac(req.query)) {
    return res.status(400).send('HMAC validation failed');
  }
  
  // (Optional) Verify that the timestamp is within an acceptable window to prevent replay attacks.
  // For example:
  // const timeDifference = Math.floor(Date.now() / 1000) - Number(timestamp);
  // if (timeDifference > 3600) { return res.status(400).send('Request timestamp is too old.'); }

  // Exchange the temporary code for a permanent access token.
  const accessTokenRequestUrl = `https://${shop}/admin/oauth/access_token`;
  const payload = {
    client_id: SHOPIFY_API_KEY,
    client_secret: SHOPIFY_API_SECRET,
    code,
  };

  try {
    const response = await axios.post(accessTokenRequestUrl, payload);
    const accessToken = response.data.access_token;
    
    // In production, securely store the access token and the shop information in your database.
    console.log(`Access Token for ${shop}:`, accessToken);
    
    // Redirect the merchant to your client app (or dashboard) after a successful installation.
    res.redirect(`${HOST}/?shop=${shop}`);
  } catch (error) {
    console.error('Error obtaining access token:', error.response ? error.response.data : error.message);
    res.status(500).send('Error obtaining access token');
  }
});

// Route to serve the main page at /shopify-bulkexport/
app.get("/shopify-bulkexport", (req, res) => {
  res.send("Shopify Bulk Export App is Running!");
});;