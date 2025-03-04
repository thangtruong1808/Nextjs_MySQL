import mysql, { RowDataPacket } from 'mysql2/promise';


import {
  CustomerField,
  CustomersTableType,
  InvoiceForm,
  InvoicesTable,
  LatestInvoiceRaw,
  Revenue,
} from './definitions';

// Define interfaces that extend RowDataPacket
interface RevenueRow extends Revenue, RowDataPacket {}
interface LatestInvoiceRawRow extends LatestInvoiceRaw, RowDataPacket {}
interface InvoicesTableRow extends InvoicesTable, RowDataPacket {}
interface InvoiceFormRow extends InvoiceForm, RowDataPacket {}
interface CustomerFieldRow extends CustomerField, RowDataPacket {}
interface CustomersTableTypeRow extends CustomersTableType, RowDataPacket {}
interface CountRow extends RowDataPacket { count: number }
interface InvoiceStatusRow extends RowDataPacket { 
  paid: number;
  pending: number;
}

import { formatCurrency } from './utils';

const pool = mysql.createPool({
  host: process.env.DB_HOST,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
});

export async function fetchRevenue() {
  try {
    // console.log('Fetching revenue data...');
    // await new Promise((resolve) => setTimeout(resolve, 3000));

    const [rows] = await pool.query<RevenueRow[]>('SELECT * FROM revenue');

    // console.log('Data fetch completed after 3 seconds.');

    return rows;
  } catch (error) {
    console.error('Database Error:', error);
    throw new Error('Failed to fetch revenue data.');
  }
}

export async function fetchLatestInvoices() {
  try {
    const [rows] = await pool.query<LatestInvoiceRawRow[]>(
      `SELECT invoices.amount, customers.name, customers.image_url, customers.email, invoices.id
       FROM invoices
       JOIN customers ON invoices.customer_id = customers.id
       ORDER BY invoices.date DESC
       LIMIT 5`
    );

    const latestInvoices = rows.map((invoice) => ({
      ...invoice,
      amount: formatCurrency(invoice.amount),
    }));
    return latestInvoices;
  } catch (error) {
    console.error('Database Error:', error);
    throw new Error('Failed to fetch the latest invoices.');
  }
}


export async function fetchCardData() {
  try {
    const [invoiceCountRows] = await pool.query<CountRow[]>('SELECT COUNT(*) as count FROM invoices');
    const [customerCountRows] = await pool.query<CountRow[]>('SELECT COUNT(*) as count FROM customers');
    const [invoiceStatusRows] = await pool.query<InvoiceStatusRow[]>(
      `SELECT
         SUM(CASE WHEN status = 'paid' THEN amount ELSE 0 END) AS paid,
         SUM(CASE WHEN status = 'pending' THEN amount ELSE 0 END) AS pending
       FROM invoices`
    );

    const numberOfInvoices = Number(invoiceCountRows[0].count ?? '0');
    const numberOfCustomers = Number(customerCountRows[0].count ?? '0');
    const totalPaidInvoices = formatCurrency(invoiceStatusRows[0].paid ?? '0');
    const totalPendingInvoices = formatCurrency(invoiceStatusRows[0].pending ?? '0');

    return {
      numberOfCustomers,
      numberOfInvoices,
      totalPaidInvoices,
      totalPendingInvoices,
    };
  } catch (error) {
    console.error('Database Error:', error);
    throw new Error('Failed to fetch card data.');
  }
}

const ITEMS_PER_PAGE = 6;
export async function fetchFilteredInvoices(
  query: string,
  currentPage: number,
) {
  const offset = (currentPage - 1) * ITEMS_PER_PAGE;

  try {
    const [invoices] = await pool.query<InvoicesTableRow[]>(
      `SELECT
        invoices.id,
        invoices.amount,
        invoices.date,
        invoices.status,
        customers.name,
        customers.email,
        customers.image_url
      FROM invoices
      JOIN customers ON invoices.customer_id = customers.id
      WHERE
        customers.name LIKE ? OR
        customers.email LIKE ? OR
        invoices.amount LIKE ? OR
        invoices.date LIKE ? OR
        invoices.status LIKE ?
      ORDER BY invoices.date DESC
      LIMIT ? OFFSET ?`,
      [`%${query}%`, `%${query}%`, `%${query}%`, `%${query}%`, `%${query}%`, ITEMS_PER_PAGE, offset]
    );

    return invoices;
  } catch (error) {
    console.error('Database Error:', error);
    throw new Error('Failed to fetch invoices.');
  }
}

export async function fetchInvoicesPages(query: string) {
  try {
    const [data] = await pool.query<CountRow[]>(
      `SELECT COUNT(*) as count
       FROM invoices
       JOIN customers ON invoices.customer_id = customers.id
       WHERE
         customers.name LIKE ? OR
         customers.email LIKE ? OR
         invoices.amount LIKE ? OR
         invoices.date LIKE ? OR
         invoices.status LIKE ?`,
      [`%${query}%`, `%${query}%`, `%${query}%`, `%${query}%`, `%${query}%`]
    );

    const totalPages = Math.ceil(Number(data[0].count) / ITEMS_PER_PAGE);
    return totalPages;
  } catch (error) {
    console.error('Database Error:', error);
    throw new Error('Failed to fetch total number of invoices.');
  }
}

export async function fetchInvoiceById(id: string) {
  try {
    const [data] = await pool.query<InvoiceFormRow[]>(
      `SELECT
        invoices.id,
        invoices.customer_id,
        invoices.amount,
        invoices.status
      FROM invoices
      WHERE invoices.id = ?`,
      [id]
    );

    const invoice = data.map((invoice) => ({
      ...invoice,
      amount: invoice.amount / 100,
    }));

    return invoice[0];
  } catch (error) {
    console.error('Database Error:', error);
    throw new Error('Failed to fetch invoice.');
  }
}

export async function fetchCustomers() {
  try {
    const [customers] = await pool.query<CustomerFieldRow[]>(
      `SELECT
        id,
        name
      FROM customers
      ORDER BY name ASC`
    );

    return customers;
  } catch (err) {
    console.error('Database Error:', err);
    throw new Error('Failed to fetch all customers.');
  }
}

export async function fetchFilteredCustomers(query: string) {
  try {
    const [data] = await pool.query<CustomersTableTypeRow[]>(
      `SELECT
        customers.id,
        customers.name,
        customers.email,
        customers.image_url,
        COUNT(invoices.id) AS total_invoices,
        SUM(CASE WHEN invoices.status = 'pending' THEN invoices.amount ELSE 0 END) AS total_pending,
        SUM(CASE WHEN invoices.status = 'paid' THEN invoices.amount ELSE 0 END) AS total_paid
      FROM customers
      LEFT JOIN invoices ON customers.id = invoices.customer_id
      WHERE
        customers.name LIKE ? OR
        customers.email LIKE ?
      GROUP BY customers.id, customers.name, customers.email, customers.image_url
      ORDER BY customers.name ASC`,
      [`%${query}%`, `%${query}%`]
    );

    const customers = data.map((customer) => ({
      ...customer,
      total_pending: formatCurrency(customer.total_pending),
      total_paid: formatCurrency(customer.total_paid),
    }));

    return customers;
  } catch (err) {
    console.error('Database Error:', err);
    throw new Error('Failed to fetch customer table.');
  }
}
