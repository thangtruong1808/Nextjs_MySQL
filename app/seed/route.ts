// import bcrypt from "bcrypt";
import mysql from "mysql2/promise";
import bcrypt from 'bcrypt';
import { invoices, customers, revenue, users } from "../lib/placeholder-data";



// At the top of your route.ts file
const dbHost = process.env.DB_HOST?.trim();
const dbUser = process.env.DB_USER?.trim();
const dbPassword = process.env.DB_PASSWORD?.trim();
const dbName = process.env.DB_NAME?.trim();

// console.log('Environment variables:', { 
//   dbHost, 
//   dbUser, 
//   // Don't log the full password in production
//   dbPasswordExists: !!dbPassword, 
//   dbName 
// });

// // Compare with hardcoded values
// const hardcodedHost = 'srv525.hstgr.io';
// const hardcodedUser = 'u506579725_user1';
// const hardcodedPassword = '2025User1!';
// const hardcodedName = 'u506579725_thangtruong';

// console.log('Are values equal?', {
//   hostEqual: dbHost === hardcodedHost,
//   userEqual: dbUser === hardcodedUser,
//   passwordEqual: dbPassword === hardcodedPassword,
//   nameEqual: dbName === hardcodedName
// });

// if (!dbHost || !dbUser || !dbPassword || !dbName) {
//   throw new Error('Database configuration environment variables are missing');
// }

// Function to hash a password
async function hashPassword(password: string): Promise<string> {
  // The salt rounds (10-12 is recommended)
  const saltRounds = 10;
  return await bcrypt.hash(password, saltRounds);
}

// Function to verify a password against a hash
async function verifyPassword(password: string, hash: string): Promise<boolean> {
  return await bcrypt.compare(password, hash);
}

const connection = await mysql.createConnection({
  host: dbHost,
  port: 3306,
  user: dbUser,
  password: dbPassword,
  database: dbName,
  connectTimeout: 10000, // Increase connection timeout
  ssl: {
    rejectUnauthorized: true, // For Hostinger's SSL connection
  },
  
});

async function seedUsers() {
  await connection.execute(`
    CREATE TABLE IF NOT EXISTS users (
      id VARCHAR(36) PRIMARY KEY,
      name VARCHAR(255) NOT NULL,
      email TEXT NOT NULL UNIQUE,
      password TEXT NOT NULL
    );
  `);

  const insertedUsers = await Promise.all(
    users.map(async (user) => {
      // const hashedPassword = await bcrypt.hash(user.password, 10);

      const hashedPassword = await hashPassword(user.password);

      return connection.execute(
        `
        INSERT INTO users (id, name, email, password)
        VALUES (UUID(), ?, ?, ?)
        ON DUPLICATE KEY UPDATE id=id;
      `,
      [user.name, user.email, hashedPassword]
        // [user.name, user.email, user.password]
      );
    })
  );

  return insertedUsers;
}

// async function authenticateUser(email: string, password: string) {
//   // Get the user from the database
//   const [users] = await connection.execute(
//     'SELECT * FROM users WHERE email = ?',
//     [email]
//   );
  
//   const user = users[0];
//   if (!user) {
//     return null; // User not found
//   }
  
//   // Verify the password
//   const passwordMatch = await verifyPassword(password, user.password);
//   if (!passwordMatch) {
//     return null; // Password doesn't match
//   }
  
//   return user; // Authentication successful
// }

async function seedInvoices() {
  await connection.execute(`
    CREATE TABLE IF NOT EXISTS invoices (
      id VARCHAR(36) PRIMARY KEY,
      customer_id VARCHAR(36) NOT NULL,
      amount INT NOT NULL,
      status VARCHAR(255) NOT NULL,
      date DATE NOT NULL
    );
  `);

  const insertedInvoices = await Promise.all(
    invoices.map(async (invoice) => {
      return connection.execute(
        `
        INSERT INTO invoices (id, customer_id, amount, status, date)
        VALUES (UUID(), ?, ?, ?, ?)
        ON DUPLICATE KEY UPDATE id=id;
      `,
        [invoice.customer_id, invoice.amount, invoice.status, invoice.date]
      );
    })
  );

  return insertedInvoices;
}

async function seedCustomers() {
  await connection.execute(`
    CREATE TABLE IF NOT EXISTS customers (
      id VARCHAR(36) PRIMARY KEY,
      name VARCHAR(255) NOT NULL,
      email VARCHAR(255) NOT NULL,
      image_url VARCHAR(255) NOT NULL
    );
  `);

  const insertedCustomers = await Promise.all(
    customers.map(async (customer) => {
      return connection.execute(
        `
        INSERT INTO customers (id, name, email, image_url)
        VALUES (?, ?, ?, ?)
        ON DUPLICATE KEY UPDATE id=id;
      `,
        [customer.id, customer.name, customer.email, customer.image_url]
      );
    })
  );

  return insertedCustomers;
}

async function seedRevenue() {
  await connection.execute(`
    CREATE TABLE IF NOT EXISTS revenue (
      month VARCHAR(4) NOT NULL UNIQUE,
      revenue INT NOT NULL
    );
  `);

  const insertedRevenue = await Promise.all(
    revenue.map(async (rev) => {
      return connection.execute(
        `
        INSERT INTO revenue (month, revenue)
        VALUES (?, ?)
        ON DUPLICATE KEY UPDATE month=month;
      `,
        [rev.month, rev.revenue]
      );
    })
  );

  return insertedRevenue;
}

export async function GET() {
  try {
    await seedUsers();
    await seedCustomers();
    await seedInvoices();
    await seedRevenue();

    return Response.json({ message: "Database seeded successfully" });
  } catch (error) {
    console.error("Error seeding database:", error);
    return Response.json({ error }, { status: 500 });
  } finally {
    // Close the connection after all operations are done
    await connection.end();
  }
}
