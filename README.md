# ConnectChain Admin Panel

This is the admin panel for ConnectChain, built with Node.js, Express, and Prisma with SQL Server.

## Database Schema Management

This project uses Prisma ORM to interact with the SQL Server database. The following commands are available for managing the database schema:

### Pulling Database Schema

To pull the latest database schema from your SQL Server database:

```bash
npm run prisma:pull
```

This command will update your `schema.prisma` file with any new tables, columns, or relationships that have been added to your database.

### Generating Prisma Client

After pulling the schema, you need to generate the Prisma client to reflect these changes in your code:

```bash
npm run prisma:generate
```

### Combined Command

For convenience, you can run both commands in sequence:

```bash
npm run db:sync
```

This will pull the latest schema and then generate the Prisma client.

### Viewing Your Database

To open Prisma Studio, a visual editor for your database:

```bash
npm run prisma:studio
```

### Formatting Prisma Schema

To format your Prisma schema file:

```bash
npm run prisma:format
```

## Important Notes

1. Make sure your `.env` file contains the correct `DATABASE_URL` for your SQL Server database.
2. After pulling a new schema, you may need to restart your application to use the updated Prisma client.
3. If you make changes to your database schema directly (not through Prisma migrations), always run `npm run db:sync` to keep your Prisma schema and client in sync with the database.

## Example Workflow

When new tables are added to your database:

1. Run `npm run db:sync` to update your Prisma schema and client
2. Restart your application if it's running
3. You can now access the new tables through the Prisma client

## Database Connection

Ensure your `.env` file has the correct connection string:

```
DATABASE_URL="sqlserver://server:port;database=dbname;user=username;password=password;trustServerCertificate=true"
```
