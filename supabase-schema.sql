-- Waitlistku Supabase Schema
-- Run this in your Supabase SQL Editor

-- Enable UUID extension
create extension if not exists "uuid-ossp";

-- Users table (custom auth, not Supabase Auth)
create table users (
  id uuid primary key default uuid_generate_v4(),
  email text unique not null,
  password_hash text not null,
  business_name text not null,
  wa_number text not null,
  created_at timestamptz default now()
);

-- Preorder sessions
create table sessions (
  id uuid primary key default uuid_generate_v4(),
  owner_id uuid references users(id) on delete cascade not null,
  title text not null,
  slug text unique not null,
  intro_text text,
  footer_text text,
  opens_at timestamptz,
  closes_at timestamptz,
  is_active boolean default true,
  primary_color text,
  accent_color text,
  payment_instructions text,
  created_at timestamptz default now()
);

-- Products / items
create table items (
  id uuid primary key default uuid_generate_v4(),
  session_id uuid references sessions(id) on delete cascade not null,
  name text not null,
  description text,
  price integer not null default 0,
  stock_quota integer,
  is_visible boolean default true,
  created_at timestamptz default now()
);

-- Promos
create table promos (
  id uuid primary key default uuid_generate_v4(),
  session_id uuid references sessions(id) on delete cascade not null,
  name text not null,
  promo_type text not null check (promo_type in ('first_n_customers', 'before_deadline', 'coupon')),
  promo_price integer not null,
  max_count integer,
  deadline timestamptz,
  coupon_code text,
  applies_to text default 'session' check (applies_to in ('session', 'item')),
  item_id uuid references items(id) on delete set null,
  created_at timestamptz default now()
);

-- Customer orders
create table orders (
  id uuid primary key default uuid_generate_v4(),
  session_id uuid references sessions(id) on delete cascade not null,
  customer_name text not null,
  customer_wa text not null,
  customer_address text not null,
  total_price integer not null default 0,
  queue_number integer not null,
  status text default 'pending' check (status in ('pending', 'approved', 'deleted')),
  created_at timestamptz default now()
);

-- Order line items
create table order_items (
  id uuid primary key default uuid_generate_v4(),
  order_id uuid references orders(id) on delete cascade not null,
  item_id uuid references items(id) on delete set null,
  quantity integer not null default 1,
  unit_price integer not null,
  created_at timestamptz default now()
);

-- Owner payment records
create table owner_payments (
  id uuid primary key default uuid_generate_v4(),
  owner_id uuid references users(id) on delete cascade not null,
  session_id uuid references sessions(id) on delete cascade not null,
  payment_type text not null check (payment_type in ('per_order', 'pack_100')),
  slots_purchased integer not null,
  amount_paid integer not null,
  payment_status text default 'paid' check (payment_status in ('pending', 'paid', 'failed')),
  created_at timestamptz default now()
);

-- Indexes for performance
create index on sessions(owner_id);
create index on sessions(slug);
create index on items(session_id);
create index on promos(session_id);
create index on orders(session_id);
create index on orders(session_id, queue_number);
create index on order_items(order_id);
create index on owner_payments(session_id, payment_status);

-- Migration: run these if upgrading an existing database
-- alter table items add column if not exists is_visible boolean default true;
-- alter table sessions add column if not exists primary_color text;
-- alter table sessions add column if not exists accent_color text;
-- alter table sessions add column if not exists payment_instructions text;
