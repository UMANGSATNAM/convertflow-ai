import pg from 'pg';

const { Pool } = pg;

// Database configuration
const pool = new Pool({
  host: process.env.DB_HOST || 'localhost',
  port: parseInt(process.env.DB_PORT || '5432'),
  database: process.env.DB_NAME || 'convertflow_ai',
  user: process.env.DB_USER || 'postgres',
  password: process.env.DB_PASSWORD || 'postgres',
  max: 20,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 2000,
});

// Test connection
pool.on('connect', () => {
  console.log('✅ Database connected successfully');
});

pool.on('error', (err) => {
  console.error('❌ Unexpected database error:', err);
  process.exit(-1);
});

// Database helper functions
export const db = {
  // Execute query
  query: async (text, params) => {
    const start = Date.now();
    const res = await pool.query(text, params);
    const duration = Date.now() - start;
    console.log('Executed query', { text, duration, rows: res.rowCount });
    return res;
  },

  // Get a client from the pool
  getClient: async () => {
    const client = await pool.connect();
    const query = client.query.bind(client);
    const release = client.release.bind(client);

    // Set a timeout of 5 seconds for queries
    const timeout = setTimeout(() => {
      console.error('A client has been checked out for more than 5 seconds!');
    }, 5000);

    // Monkey patch the methods to keep track of the client getting released
    client.query = (...args) => {
      clearTimeout(timeout);
      return query(...args);
    };

    client.release = () => {
      clearTimeout(timeout);
      client.query = query;
      client.release = release;
      return release();
    };

    return client;
  },

  // Shop queries
  shops: {
    findByDomain: async (domain) => {
      const result = await db.query(
        'SELECT * FROM shops WHERE shop_domain = $1',
        [domain]
      );
      return result.rows[0];
    },

    create: async (domain, accessToken) => {
      const result = await db.query(
        'INSERT INTO shops (shop_domain, access_token) VALUES ($1, $2) RETURNING *',
        [domain, accessToken]
      );
      return result.rows[0];
    },

    updateSubscription: async (shopId, status, subscriptionId) => {
      const result = await db.query(
        'UPDATE shops SET subscription_status = $1, subscription_id = $2, updated_at = CURRENT_TIMESTAMP WHERE id = $3 RETURNING *',
        [status, subscriptionId, shopId]
      );
      return result.rows[0];
    },
  },

  // Section queries
  sections: {
    getAll: async () => {
      const result = await db.query('SELECT * FROM sections ORDER BY category, variation_number');
      return result.rows;
    },

    getByCategory: async (category) => {
      const result = await db.query(
        'SELECT * FROM sections WHERE category = $1 ORDER BY variation_number',
        [category]
      );
      return result.rows;
    },

    getById: async (id) => {
      const result = await db.query('SELECT * FROM sections WHERE id = $1', [id]);
      return result.rows[0];
    },
  },

  // Customization queries
  customizations: {
    getByShop: async (shopId) => {
      const result = await db.query(
        'SELECT c.*, s.name as section_name, s.category FROM customizations c JOIN sections s ON c.section_id = s.id WHERE c.shop_id = $1 AND c.is_active = true',
        [shopId]
      );
      return result.rows;
    },

    save: async (shopId, sectionId, settings) => {
      const result = await db.query(
        `INSERT INTO customizations (shop_id, section_id, custom_settings) 
         VALUES ($1, $2, $3) 
         ON CONFLICT (shop_id, section_id) 
         DO UPDATE SET custom_settings = $3, updated_at = CURRENT_TIMESTAMP 
         RETURNING *`,
        [shopId, sectionId, JSON.stringify(settings)]
      );
      return result.rows[0];
    },
  },
};

export default db;
