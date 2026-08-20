import { Pool } from 'pg';

export const POSTGRES_URL =
  process.env.POSTGRES_URL_NON_POOLING ||
  process.env.POSTGRES_PRISMA_URL ||
  process.env.POSTGRES_URL ||
  'postgres://postgres.kbdyxoavixbzmaqltdhc:UcVHRtNvYp7Eaq6k@aws-0-us-east-1.pooler.supabase.com:5432/postgres?sslmode=require';

let pgPool: Pool | null = null;

export function getPostgresPool(): Pool {
  if (!pgPool) {
    const rawUrl = POSTGRES_URL.replace(/[?&]sslmode=[^&]+/g, '');
    pgPool = new Pool({
      connectionString: rawUrl,
      ssl: {
        rejectUnauthorized: false
      },
      connectionTimeoutMillis: 15000
    });
  }
  return pgPool;
}

export async function runPostgresMigration(): Promise<{ success: boolean; message: string; tablesCreated?: string[] }> {
  const pool = getPostgresPool();
  const client = await pool.connect();
  try {
    const migrationSql = `
      -- Products
      create table if not exists products (
        id text primary key,
        name text not null,
        barcode text,
        sku text,
        category_id text,
        brand_id text,
        unit_id text,
        purchase_price numeric default 0,
        sale_price numeric default 0,
        current_stock numeric default 0,
        min_stock numeric default 0,
        image_url text,
        tenant_id text default 'default',
        created_at timestamp default now(),
        updated_at timestamp default now()
      );

      -- Sales
      create table if not exists sales (
        id text primary key,
        invoice_number text not null,
        date text not null,
        customer_id text,
        customer_name text,
        customer_phone text,
        items jsonb not null default '[]'::jsonb,
        subtotal numeric default 0,
        discount numeric default 0,
        tax numeric default 0,
        grand_total numeric not null default 0,
        paid_amount numeric default 0,
        due_amount numeric default 0,
        payment_method text,
        tenant_id text default 'default',
        created_at timestamp default now(),
        updated_at timestamp default now()
      );

      -- Customers
      create table if not exists customers (
        id text primary key,
        name text not null,
        phone text,
        email text,
        address text,
        total_spent numeric default 0,
        due_amount numeric default 0,
        tenant_id text default 'default',
        created_at timestamp default now(),
        updated_at timestamp default now()
      );

      -- Suppliers
      create table if not exists suppliers (
        id text primary key,
        name text not null,
        company_name text,
        phone text,
        email text,
        address text,
        due_amount numeric default 0,
        tenant_id text default 'default',
        created_at timestamp default now(),
        updated_at timestamp default now()
      );

      -- Purchases
      create table if not exists purchases (
        id text primary key,
        po_number text not null,
        date text not null,
        supplier_id text,
        supplier_name text,
        items jsonb not null default '[]'::jsonb,
        total_amount numeric not null default 0,
        paid_amount numeric default 0,
        due_amount numeric default 0,
        tenant_id text default 'default',
        created_at timestamp default now(),
        updated_at timestamp default now()
      );

      -- Expenses
      create table if not exists expenses (
        id text primary key,
        title text not null,
        category_id text,
        amount numeric not null default 0,
        date text not null,
        voucher_no text,
        payment_method text,
        tenant_id text default 'default',
        created_at timestamp default now(),
        updated_at timestamp default now()
      );

      -- Incomes
      create table if not exists incomes (
        id text primary key,
        title text not null,
        category_id text,
        amount numeric not null default 0,
        date text not null,
        voucher_no text,
        payment_method text,
        tenant_id text default 'default',
        created_at timestamp default now(),
        updated_at timestamp default now()
      );

      -- Categories
      create table if not exists categories (
        id text primary key,
        name text not null,
        code text,
        tenant_id text default 'default',
        created_at timestamp default now()
      );

      -- Brands
      create table if not exists brands (
        id text primary key,
        name text not null,
        tenant_id text default 'default',
        created_at timestamp default now()
      );

      -- Units
      create table if not exists units (
        id text primary key,
        name text not null,
        short_name text,
        tenant_id text default 'default',
        created_at timestamp default now()
      );

      -- Enable RLS and public policies for each table
      alter table products enable row level security;
      create policy "Public access products" on products for all using (true) with check (true);

      alter table sales enable row level security;
      create policy "Public access sales" on sales for all using (true) with check (true);

      alter table customers enable row level security;
      create policy "Public access customers" on customers for all using (true) with check (true);

      alter table suppliers enable row level security;
      create policy "Public access suppliers" on suppliers for all using (true) with check (true);

      alter table purchases enable row level security;
      create policy "Public access purchases" on purchases for all using (true) with check (true);

      alter table expenses enable row level security;
      create policy "Public access expenses" on expenses for all using (true) with check (true);

      alter table incomes enable row level security;
      create policy "Public access incomes" on incomes for all using (true) with check (true);
    `;

    await client.query(migrationSql);
    return {
      success: true,
      message: 'All Supabase PostgreSQL database tables created and initialized successfully!',
      tablesCreated: [
        'products',
        'sales',
        'customers',
        'suppliers',
        'purchases',
        'expenses',
        'incomes',
        'categories',
        'brands',
        'units'
      ]
    };
  } catch (err: any) {
    // If policy already exists, still treat as success
    if (err?.message?.includes('already exists')) {
      return {
        success: true,
        message: 'Tables are already configured and active in PostgreSQL database!'
      };
    }
    return {
      success: false,
      message: err?.message || 'Database migration error'
    };
  } finally {
    client.release();
  }
}
