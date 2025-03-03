'use server';
 
import { z } from 'zod';
import mysql from 'mysql2/promise';
import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';

const FormSchema = z.object({
    id: z.string(),
    customerId: z.string({
        required_error: "Customer ID is required"
    }).min(1, "Customer ID cannot be empty"), 
    amount: z.coerce.number({
        required_error: "Amount is required"
    }).positive("Amount must be greater than 0"),
    status: z.enum(['pending', 'paid'], {
        required_error: "Status must be either pending or paid"
    }),
    date: z.string(),
});
  
const CreateInvoice = FormSchema.omit({ id: true, date: true });
const UpdateInvoice = FormSchema.omit({ id: true, date: true });

export async function createInvoice(formData: FormData) {
    try {
        const { customerId, amount, status } = CreateInvoice.parse({
            customerId: formData.get('customerId'),
            amount: formData.get('amount'),
            status: formData.get('status'),
        });
        
        if (!customerId) {
            throw new Error('Customer ID is required');
        }

        const amountInCents = amount * 100;
        const date = new Date().toISOString().split('T')[0];
        const id = crypto.randomUUID();

        const connection = await mysql.createConnection({
            host: process.env.DB_HOST,
            user: process.env.DB_USER,
            password: process.env.DB_PASSWORD,
            database: process.env.DB_NAME
        });

        try {
            await connection.execute(
                'INSERT INTO invoices (id, customer_id, amount, status, date) VALUES (?, ?, ?, ?, ?)',
                [id, customerId, amountInCents, status, date]
            );
            revalidatePath('/dashboard/invoices');
            redirect('/dashboard/invoices');
        } finally {
            await connection.end();
        }
    } catch (error) {
        if (error instanceof z.ZodError) {
            throw new Error(`Invalid form data: ${error.errors.map(e => e.message).join(', ')}`);
        }
        throw error;
    }
}

export async function updateInvoice(id: string, formData: FormData) {
    const { customerId, amount, status } = UpdateInvoice.parse({
      customerId: formData.get('customerId'),
      amount: formData.get('amount'),
      status: formData.get('status'),
    });
   
    const amountInCents = amount * 100;

    const connection = await mysql.createConnection({
        host: process.env.DB_HOST,
        user: process.env.DB_USER,
        password: process.env.DB_PASSWORD,
        database: process.env.DB_NAME
    });
   
    try {
        await connection.execute(
            'UPDATE invoices SET customer_id = ?, amount = ?, status = ? WHERE id = ?',
            [customerId, amountInCents, status, id]
        );
        revalidatePath('/dashboard/invoices');
        redirect('/dashboard/invoices');
    } finally {
        await connection.end();
    }
}