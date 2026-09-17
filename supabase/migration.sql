-- הרצה ידנית ב-SQL Editor של פרויקט Supabase החדש (הקדשי לאפליקציית תרופות
-- לחיות המחמד — נפרד מפרויקט הצמחים). בלי RLS: גישה פתוחה, בכוונה — אין
-- אימות משתמשים באפליקציה, כמו שהוסבר וסוכם.

create table pets (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  emoji text not null default '🐶',
  created_at timestamptz not null default now()
);

create table medications (
  id uuid primary key default gen_random_uuid(),
  pet_id uuid not null references pets(id) on delete cascade,
  name text not null,
  dosage_text text,
  instructions_text text,
  last_given_at timestamptz,
  last_given_by text,
  created_at timestamptz not null default now()
);

alter publication supabase_realtime add table pets, medications;
