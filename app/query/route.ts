import mysql from 'mysql2/promise';

const pool = mysql.createPool({
  host: process.env.DB_HOST,
  port: 3306,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
  connectTimeout: 10000, // Increase connection timeout
  ssl: {
    rejectUnauthorized: false
    // IF Set to false to accept self-signed certificates
  }
});

async function listInvoices() {
  const [rows] = await pool.execute(`
    SELECT invoices.amount, customers.name 
    FROM invoices 
    JOIN customers ON invoices.customer_id = customers.id
    WHERE invoices.amount = 666;
  `);

  return rows;
}

export async function GET() {
  // return Response.json({
  //   message:
  //     'Uncomment this file and remove this line. You can delete this file when you are finished.',
  // });
  try {
    return Response.json(await listInvoices());
  } catch (error) {
    return Response.json({ error }, { status: 500 });
  }
}
