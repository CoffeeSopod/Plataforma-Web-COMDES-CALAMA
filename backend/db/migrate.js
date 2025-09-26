import fs from 'fs';
import path from 'path';
import mysql from 'mysql2/promise';
import dotenv from 'dotenv';
dotenv.config();

const MIGRATIONS_DIR = path.resolve('db/migrations');

async function ensureDatabase(conn, dbName) {
  await conn.query(`CREATE DATABASE IF NOT EXISTS \`${dbName}\` CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci`);
  await conn.query(`USE \`${dbName}\``);
}

async function ensureMigrationsTable(conn) {
  await conn.query(`
    CREATE TABLE IF NOT EXISTS _schema_migrations (
      id INT AUTO_INCREMENT PRIMARY KEY,
      filename VARCHAR(255) NOT NULL UNIQUE,
      applied_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
    ) ENGINE=InnoDB;
  `);
}

async function getApplied(conn) {
  const [rows] = await conn.query(`SELECT filename FROM _schema_migrations`);
  return new Set(rows.map(r => r.filename));
}

async function main() {
  const { DB_HOST, DB_PORT = 3306, DB_USER, DB_PASS, DB_NAME } = process.env;

  // multipleStatements para ejecutar dumps simples;
  // OJO: si tu SQL tiene DELIMITER/procedures complejas, mejor usar el cliente "mysql" CLI.
  const conn = await mysql.createConnection({
    host: DB_HOST,
    port: Number(DB_PORT),
    user: DB_USER,
    password: DB_PASS,
    multipleStatements: true
  });

  try {
    await ensureDatabase(conn, DB_NAME);
    await ensureMigrationsTable(conn);

    const applied = await getApplied(conn);
    const files = fs.readdirSync(MIGRATIONS_DIR).filter(f => f.endsWith('.sql')).sort();

    for (const file of files) {
      if (applied.has(file)) continue;

      // lee SQL
      let sql = fs.readFileSync(path.join(MIGRATIONS_DIR, file), 'utf8');

      // si tu dump trae "CREATE DATABASE/USE", puedes intentar removerlas aquí:
      sql = sql
        .replace(/CREATE DATABASE[\s\S]*?;/gi, '')
        .replace(/USE\s+`?[\w-]+`?\s*;/gi, '');

      console.log(`▶ Aplicando migración: ${file}`);
      await conn.query(`USE \`${DB_NAME}\``); // asegúrate de estar en la BD
      await conn.query(sql);
      await conn.query(`INSERT INTO _schema_migrations (filename) VALUES (?)`, [file]);
      console.log(`✔ OK: ${file}`);
    }

    console.log('✅ Migraciones al día');
  } catch (e) {
    console.error('❌ Error en migraciones', e);
    process.exit(1);
  } finally {
    await conn.end();
  }
}

main();
