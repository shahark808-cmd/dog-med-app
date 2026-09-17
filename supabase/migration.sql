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

-- Supabase מפעיל RLS כברירת מחדל על טבלאות חדשות (חוסם הכל בלי policies) —
-- מכבים אותה במפורש, כי אין כאן אימות משתמשים בכלל.
alter table pets disable row level security;
alter table medications disable row level security;

-- כל תרופה מוצגת עם 3 סימוני וי קבועים ליום (DOSES_PER_DAY באפליקציה, לא
-- עמודה במסד) — בלי לוג נפרד: סופרים "כמה ניתנו היום" ומאפסים באופן עצל
-- (lazy) בכל פעם שהתאריך השתנה, בלי cron.
alter table medications add column given_today_count int not null default 0;
alter table medications add column given_today_date date;
