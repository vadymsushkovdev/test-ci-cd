// src/sql-injection.ts
import { Client } from 'pg';

const client = new Client({
    connectionString: process.env.DATABASE_URL,
});
// @ts-ignore
await client.connect();

/**
 * 🚨 Vulnerable to SQL injection!
 * Constructs the query by concatenating `id` directly into the SQL string.
 */
export async function getUserById(id: string) {
    const query = `SELECT * FROM users WHERE id = '${id}'`;
    const res = await client.query(query);
    return res.rows;
}
