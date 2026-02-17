import mysql from 'mysql2/promise';

// Database configuration
const pool = mysql.createPool({
  host: process.env.DB_HOST || 'localhost',
  port: parseInt(process.env.DB_PORT || '3306'),
  database: process.env.DB_NAME || 'convertflow_ai',
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || '',
  waitForConnections: true,
  connectionLimit: 10,
  maxIdle: 10,
  idleTimeout: 60000,
  queueLimit: 0,
  enableKeepAlive: true,
  keepAliveInitialDelay: 0
});

// Test connection
pool.getConnection()
  .then(connection => {
    console.log('✅ Database connected successfully');
    connection.release();
  })
  .catch(err => {
    console.error('❌ Unexpected database error:', err);
  });

// Database helper functions
export const db = {
  // Execute query
  query: async (text, params) => {
    const start = Date.now();
    try {
      const [rows, fields] = await pool.execute(text, params);
      const duration = Date.now() - start;
      console.log('Executed query', { text, duration, rows: rows.length });
      return { rows, rowCount: rows.length };
    } catch (error) {
      console.error('Query error', { text, error });
      throw error;
    }
  },

  // Get a client from the pool (simulated for compatibility)
  getClient: async () => {
    const connection = await pool.getConnection();
    return connection;
  },

  // Shop queries
  shops: {
    findByDomain: async (domain) => {
      const result = await db.query(
        'SELECT * FROM shops WHERE shop_domain = ?',
        [domain]
      );
      return result.rows[0];
    },

    create: async (domain, accessToken) => {
      // MySQL doesn't support RETURNING * in INSERT easily without extra query
      await db.query(
        'INSERT INTO shops (shop_domain, access_token) VALUES (?, ?)',
        [domain, accessToken]
      );
      // Fetch the created record
      const result = await db.query(
        'SELECT * FROM shops WHERE shop_domain = ?',
        [domain]
      );
      return result.rows[0];
    },

    updateSubscription: async (shopId, status, subscriptionId) => {
      await db.query(
        'UPDATE shops SET subscription_status = ?, subscription_id = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?',
        [status, subscriptionId, shopId]
      );
      const result = await db.query('SELECT * FROM shops WHERE id = ?', [shopId]);
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
        'SELECT * FROM sections WHERE category = ? ORDER BY variation_number',
        [category]
      );
      return result.rows;
    },

    getById: async (id) => {
      const result = await db.query('SELECT * FROM sections WHERE id = ?', [id]);
      return result.rows[0];
    },
  },

  // Customization queries
  customizations: {
    getByShop: async (shopId) => {
      const result = await db.query(
        'SELECT c.*, s.name as section_name, s.category FROM customizations c JOIN sections s ON c.section_id = s.id WHERE c.shop_id = ? AND c.is_active = true',
        [shopId]
      );
      return result.rows;
    },

    save: async (shopId, sectionId, settings) => {
      const settingsStr = JSON.stringify(settings);

      // MySQL UPSERT syntax
      await db.query(
        `INSERT INTO customizations (shop_id, section_id, custom_settings) 
         VALUES (?, ?, ?) 
         ON DUPLICATE KEY UPDATE custom_settings = ?, updated_at = CURRENT_TIMESTAMP`,
        [shopId, sectionId, settingsStr, settingsStr]
      );

      const result = await db.query(
        'SELECT * FROM customizations WHERE shop_id = ? AND section_id = ?',
        [shopId, sectionId]
      );
      return result.rows[0];
    },
  },
};

export default db;
