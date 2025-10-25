const mysql = require('mysql2/promise');
require('dotenv').config();

async function create() {
  const host = process.env.DB_HOST || 'localhost';
  const user = process.env.DB_USER || 'root';
  const password = process.env.DB_PASS || '';

  const conn = await mysql.createConnection({ host, user, password });
  await conn.query('CREATE DATABASE IF NOT EXISTS `country_cache` CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;');
  await conn.query('USE `country_cache`;');

  const createTable = `
    CREATE TABLE IF NOT EXISTS countries (
      id INT AUTO_INCREMENT PRIMARY KEY,
      name VARCHAR(200) NOT NULL,
      capital VARCHAR(200),
      region VARCHAR(100),
      population BIGINT,
      currency_code VARCHAR(10),
      exchange_rate DOUBLE,
      estimated_gdp DOUBLE,
      last_refreshed_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
      flag_url VARCHAR(500),
      UNIQUE KEY uq_name (name)
    ) ENGINE=InnoDB;
  `;
  await conn.query(createTable);
  await conn.end();
  console.log('Database and table created (or already exist).');
}

create().catch(err => {
  console.error('Create DB failed:', err.message);
  process.exit(1);
});