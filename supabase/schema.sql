-- ============================================================================
-- FactuCheck — schéma Postgres (Supabase) avec sécurité par ligne (RLS).
-- Hébergement : choisir une région UE à la création du projet Supabase.
-- Multi-tenant : tout est rattaché à une `organizations` (cabinet ou entreprise).
-- ============================================================================

create extension if not exists "pgcrypto";

-- Organisations (cabinet multi-clients OU entreprise/indépendant) -------------
create table if not exists organizations (
  id uuid primary key default gen_random_uuid(),
  nom text not null,
  type text not null check (type in ('cabinet', 'entreprise')),
  created_at timestamptz not null default now()
);

-- Rôles au sein d'une organisation --------------------------------------------
create table if not exists memberships (
  id uuid primary key default gen_random_uuid(),
  org_id uuid not null references organizations(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  role text not null check (role in ('admin', 'collaborateur', 'client_lecture')),
  created_at timestamptz not null default now(),
  unique (org_id, user_id)
);

-- Dossiers clients (pour les cabinets) ----------------------------------------
create table if not exists clients (
  id uuid primary key default gen_random_uuid(),
  org_id uuid not null references organizations(id) on delete cascade,
  nom text not null,
  siren text,
  created_at timestamptz not null default now()
);

-- Factures déposées ------------------------------------------------------------
create table if not exists invoices (
  id uuid primary key default gen_random_uuid(),
  org_id uuid not null references organizations(id) on delete cascade,
  client_id uuid references clients(id) on delete set null,
  nom_fichier text not null,
  format text,
  storage_path text,              -- chemin du fichier chiffré (bucket privé)
  supprimer_apres timestamptz,    -- purge automatique (rétention)
  created_by uuid references auth.users(id),
  created_at timestamptz not null default now()
);

-- Rapports (résultat d'un test) -----------------------------------------------
create table if not exists reports (
  id uuid primary key default gen_random_uuid(),
  invoice_id uuid not null references invoices(id) on delete cascade,
  org_id uuid not null references organizations(id) on delete cascade,
  score int not null check (score between 0 and 100),
  conforme boolean not null,
  format text,
  profil_facturx text,
  counts jsonb not null,
  findings jsonb not null,        -- tableau de Finding (voir src/lib/engine/types.ts)
  created_at timestamptz not null default now()
);

-- Abonnements (Stripe) ---------------------------------------------------------
create table if not exists subscriptions (
  org_id uuid primary key references organizations(id) on delete cascade,
  plan text not null default 'gratuit' check (plan in ('gratuit', 'pro', 'cabinet')),
  stripe_customer_id text,
  stripe_subscription_id text,
  statut text not null default 'active',
  quota_mensuel int not null default 10,
  consomme_ce_mois int not null default 0,
  updated_at timestamptz not null default now()
);

-- Clés API (une par organisation) ---------------------------------------------
create table if not exists api_keys (
  id uuid primary key default gen_random_uuid(),
  org_id uuid not null references organizations(id) on delete cascade,
  hash text not null,             -- on stocke le HASH de la clé, jamais la clé
  prefixe text not null,
  created_at timestamptz not null default now(),
  derniere_utilisation timestamptz
);

-- Journal d'audit (RGPD) -------------------------------------------------------
create table if not exists audit_log (
  id uuid primary key default gen_random_uuid(),
  org_id uuid not null references organizations(id) on delete cascade,
  user_id uuid references auth.users(id),
  action text not null,           -- ex. 'export', 'suppression', 'acces'
  details jsonb,
  created_at timestamptz not null default now()
);

-- ============================================================================
-- Row Level Security : un membre n'accède qu'aux données de ses organisations.
-- ============================================================================
alter table organizations enable row level security;
alter table memberships   enable row level security;
alter table clients       enable row level security;
alter table invoices      enable row level security;
alter table reports       enable row level security;
alter table subscriptions enable row level security;
alter table api_keys      enable row level security;
alter table audit_log     enable row level security;

-- Fonction : l'utilisateur courant est-il membre de l'organisation ?
create or replace function is_member(target_org uuid)
returns boolean language sql security definer stable as $$
  select exists (
    select 1 from memberships m
    where m.org_id = target_org and m.user_id = auth.uid()
  );
$$;

-- Politiques (lecture pour les membres ; écriture à affiner selon le rôle).
create policy "membres lisent leur org" on organizations
  for select using (is_member(id));

create policy "membres voient leurs adhésions" on memberships
  for select using (user_id = auth.uid() or is_member(org_id));

create policy "membres accèdent aux clients" on clients
  for all using (is_member(org_id)) with check (is_member(org_id));

create policy "membres accèdent aux factures" on invoices
  for all using (is_member(org_id)) with check (is_member(org_id));

create policy "membres accèdent aux rapports" on reports
  for all using (is_member(org_id)) with check (is_member(org_id));

create policy "membres voient leur abonnement" on subscriptions
  for select using (is_member(org_id));

create policy "membres gèrent leurs clés" on api_keys
  for all using (is_member(org_id)) with check (is_member(org_id));

create policy "membres lisent l'audit" on audit_log
  for select using (is_member(org_id));

-- NB : affiner les droits d'écriture par rôle (ex. 'client_lecture' en SELECT
-- seul) via des politiques distinctes par commande (insert/update/delete).
