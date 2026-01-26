/**
 * Drizzle ORM Database Client Module
 *
 * This module creates and exports the Drizzle ORM database client instance for PostgreSQL.
 * It uses the postgres.js driver for database connections and provides a typed interface
 * for database operations throughout the application.
 *
 * The client is configured with:
 * - Connection string from DATABASE_URL environment variable
 * - Prepared statements disabled for compatibility with serverless environments
 *
 * This is the primary database client used across the application for all database
 * operations including queries, inserts, updates, and deletes.
 */
import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";

/**
 * PostgreSQL client instance
 *
 * Configured with prepared statements disabled ({ prepare: false }) which is
 * required for compatibility with some serverless/edge environments and connection
 * poolers like PgBouncer in transaction mode.
 */
const client = postgres(process.env.DATABASE_URL!, { prepare: false });

/**
 * Drizzle ORM database instance
 *
 * This is the main database client used throughout the application for type-safe
 * database operations. It provides a fluent API for building and executing SQL queries
 * with full TypeScript type inference based on your schema definitions.
 *
 * @example
 * // Import in your server code
 * import db from '~/core/db/drizzle-client.server';
 *
 * // Query example
 * const users = await db.select().from(usersTable);
 *
 * // Insert example
 * await db.insert(usersTable).values({ name: 'John', email: 'john@example.com' });
 */
const db = drizzle({ client });

export default db;
