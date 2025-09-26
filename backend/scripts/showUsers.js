import mysql from 'mysql2/promise';
import dotenv from 'dotenv';
dotenv.config();

async function main() {
  const conn = await mysql.createConnection({
    host: process.env.DB_HOST,
    port: process.env.DB_PORT,
    user: process.env.DB_USER,
    password: process.env.DB_PASS,
    database: process.env.DB_NAME
  });

  const [rows] = await conn.query("SELECT correo, password FROM usuario");
  console.table(rows); // Muestra como tabla en consola

  await conn.end();
}

main().catch(err => {
  console.error("❌ Error al consultar:", err);
});
