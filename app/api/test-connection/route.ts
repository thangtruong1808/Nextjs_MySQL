import { NextResponse } from 'next/server';
import mysql from 'mysql2/promise';

export async function GET() {
  let connection;
  try {
    connection = await mysql.createConnection({
      host: 'srv525.hstgr.io',
      user: 'u506579725_user1',
      password: '2025User1!@#',
      database: 'u506579725_thangtruong',
      connectTimeout: 10000
    });
    
    // Test a simple query
    const [rows] = await connection.execute('SELECT 1 as test');
    
    return NextResponse.json({ 
      status: 'success', 
      message: 'Connected successfully!',
      data: rows
    });
    
  } catch (error) {
    console.error('Connection failed:', error);
    return NextResponse.json({ 
      status: 'error', 
      message: 'Connection failed',
      error: error instanceof Error ? error.message : String(error)
    }, { status: 500 });
  } finally {
    if (connection) await connection.end();
  }
}
