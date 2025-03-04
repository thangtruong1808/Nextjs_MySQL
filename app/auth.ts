import NextAuth from 'next-auth';
import Credentials from 'next-auth/providers/credentials';
import { authConfig } from './auth.config';
import { z } from 'zod';
import type { User } from '@/app/lib/definitions';
import bcrypt from 'bcrypt';
import mysql, { RowDataPacket } from 'mysql2/promise';

const pool = mysql.createPool({
  host: process.env.DB_HOST,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
  ssl: {
    rejectUnauthorized: true
  }
});

// Define interfaces that extend RowDataPacket
interface UserRow extends User, RowDataPacket {}

async function getUser(email: string): Promise<User | undefined> {
    try {
      const [rows] = await pool.query<UserRow[]>('SELECT * FROM users WHERE email = ?', [email]);
      return rows[0];
    } catch (error) {
      return undefined;
    }
}
  
export const { auth, signIn, signOut } = NextAuth({
    ...authConfig,
    debug: false, // Disable verbose logging
  providers: [
    Credentials({
      async authorize(credentials) {
        try {
          const parsedCredentials = z
            .object({ email: z.string().email(), password: z.string().min(6) })
            .safeParse(credentials);

          if (parsedCredentials.success) {
            const { email, password } = parsedCredentials.data;
            const user = await getUser(email);
            if (!user) return null;
            const passwordsMatch = await bcrypt.compare(password, user.password);

            if (passwordsMatch) return user;
          }
          return null;
        } catch (error) {
          return null;
        }
      },
    }),
    ],
  // Custom logger to control what gets logged
  logger: {
    error(error) {
        // Check if the error message contains credential-related text
        const errorString = String(error);
        if (!errorString.includes('credentials') && !errorString.includes('signin')) {
          console.error(`[auth] Error:`, error);
        }
      },
    warn(code: string) {
      // Only log critical warnings
      if (code !== 'JWT_SESSION_ERROR') {
        console.warn(`[auth] Warning: ${code}`);
      }
    },
    debug(code?: string) {
      // Don't log any debug messages
    },
  }
});
