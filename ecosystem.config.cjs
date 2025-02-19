// ecosystem.config.cjs
module.exports = {
    apps: [
      {
        name: 'shopify-bulkexport',
        script: './server/server.js',
        cwd: '/var/www/shopify-bulkexport', 
        watch: false,
        // If you want environment variables:
        env_production: {
          NODE_ENV: 'production'
        }
      }
    ]
  }