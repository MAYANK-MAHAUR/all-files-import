-- PayMemo encrypted cloud sync schema.
-- Private user metadata is stored only as encrypted blobs produced client-side.

create table if not exists users (
  wallet_address text primary key,
  created_at timestamptz not null default now()
);

create table if not exists payment_intents (
  id text primary key,
  wallet_address text not null references users(wallet_address),
  chain_id integer not null,
  expected_from text,
  expected_to text not null,
  expected_token text not null,
  expected_amount text not null,
  encrypted_metadata jsonb not null,
  status text not null check (
    status in (
      'pending_signature',
      'pending_chain',
      'confirmed',
      'failed',
      'rejected',
      'needs-review'
    )
  ),
  tx_hash text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists transactions (
  id text primary key,
  wallet_address text not null references users(wallet_address),
  chain_id integer not null,
  tx_hash text not null,
  from_address text,
  to_address text,
  token text not null,
  amount text not null,
  status text not null,
  encrypted_metadata jsonb not null,
  block_number bigint,
  confirmed_at timestamptz,
  created_at timestamptz not null default now()
);

create table if not exists invoices (
  id text primary key,
  owner_wallet text not null references users(wallet_address),
  invoice_number text not null,
  amount text not null,
  token text not null,
  payer text,
  payee text not null,
  encrypted_invoice_metadata jsonb not null,
  status text not null check (status in ('draft', 'sent', 'paid', 'cancelled')),
  linked_tx_hash text,
  created_at timestamptz not null default now()
);

create table if not exists counterparties (
  id text primary key,
  owner_wallet text not null references users(wallet_address),
  counterparty_wallet text,
  encrypted_name jsonb not null,
  encrypted_role jsonb,
  encrypted_notes jsonb,
  created_at timestamptz not null default now()
);

create table if not exists batch_payouts (
  id text primary key,
  owner_wallet text not null references users(wallet_address),
  chain_id integer not null,
  encrypted_batch_name jsonb not null,
  encrypted_notes jsonb,
  status text not null,
  created_at timestamptz not null default now()
);

create table if not exists batch_payout_items (
  id text primary key,
  batch_id text not null references batch_payouts(id) on delete cascade,
  recipient_address text not null,
  amount text not null,
  token text not null,
  status text not null,
  tx_hash text,
  encrypted_metadata jsonb not null
);

create table if not exists agent_payment_intents (
  id text primary key,
  owner_wallet text not null references users(wallet_address),
  agent_id text not null,
  task_id text not null,
  tool_or_service text,
  expected_recipient text not null,
  expected_amount text not null,
  token text not null,
  encrypted_reason_context jsonb not null,
  status text not null,
  tx_hash text,
  created_at timestamptz not null default now()
);

create table if not exists linked_transactions (
  id text primary key,
  source_tx text not null,
  destination_tx text,
  relation_type text not null check (
    relation_type in ('bridge', 'swap', 'invoice', 'payroll', 'refund', 'agent-task')
  ),
  encrypted_metadata jsonb,
  created_at timestamptz not null default now()
);
