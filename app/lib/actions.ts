'use server';
 
import { z } from 'zod';
import mysql from 'mysql2/promise';
import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';

const FormSchema = z.object({
    id: z.string(),
    customerId: z.string({
        invalid_type_error: 'Please select a customer.',
    }), 

    amount: z.coerce
    .number()
    .gt(0, { message: 'Please enter an amount greater than $0.' }),

    status: z.enum(['pending', 'paid'], {
        invalid_type_error: 'Please select an invoice status.',
      }),
    date: z.string(),
});
  
const CreateInvoice = FormSchema.omit({ id: true, date: true });
const UpdateInvoice = FormSchema.omit({ id: true, date: true });

export type State = {
    errors?: {
      customerId?: string[];
      amount?: string[];
      status?: string[];
    };
    message?: string | null;
};
  

export async function createInvoice(prevState: State, formData: FormData) {
    try {
        // Validate form using Zod
        const validatedFields = CreateInvoice.safeParse({
            customerId: formData.get('customerId'),
            amount: formData.get('amount'),
            status: formData.get('status'),
        });
        
        // If form validation fails, return errors early. Otherwise, continue.
        if (!validatedFields.success) {
            return {
            errors: validatedFields.error.flatten().fieldErrors,
            message: 'Missing Fields. Failed to Create Invoice.',
            };
        }

         // Prepare data for insertion into the database
        const { customerId, amount, status } = validatedFields.data;
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
           
        } finally {
            await connection.end();
        }
    } catch (error) {
         // If a database error occurs, return a more specific error.
        return {
            message: 'Database Error: Failed to Create Invoice.',
        };
    }
    revalidatePath('/dashboard/invoices');
    redirect('/dashboard/invoices');
}

export async function updateInvoice(
    id: string,
    prevState: State,
    formData: FormData,
  ) {


    const validatedFields = UpdateInvoice.safeParse({
        customerId: formData.get('customerId'),
        amount: formData.get('amount'),
        status: formData.get('status'),
      });
     
      if (!validatedFields.success) {
        return {
          errors: validatedFields.error.flatten().fieldErrors,
          message: 'Missing Fields. Failed to Update Invoice.',
        };
      }
     
      const { customerId, amount, status } = validatedFields.data;
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


export async function deleteInvoice(id: string) {
    const connection = await mysql.createConnection({
        host: process.env.DB_HOST,
        user: process.env.DB_USER,
        password: process.env.DB_PASSWORD,
        database: process.env.DB_NAME
    });

    try {
        await connection.execute(
            'DELETE FROM invoices WHERE id = ?',
            [id]
        );
        // Since this action is being called in the /dashboard/invoices path, 
        // you don't need to call redirect. Calling revalidatePath will trigger 
        // a new server request and re-render the table
        revalidatePath('/dashboard/invoices');
    } finally {
        await connection.end();
    }
}
