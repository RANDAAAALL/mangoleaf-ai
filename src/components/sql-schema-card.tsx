export function SqlSchemaCard() {
  return (
    <div className="bg-slate-900/15 border border-slate-900 p-5 rounded-2xl text-[11px] text-slate-450">
      <h3 className="font-bold text-slate-350 mb-2.5 flex items-center gap-1.5 uppercase tracking-wide">
        <svg className="h-4 w-4 text-emerald-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
          <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
        </svg>
        SQL Scans Schema
      </h3>
      <p className="mb-2 leading-relaxed">
        Run this SQL script in your Supabase dashboard to support PWA image storage uploads and log entries:
      </p>
      <pre className="bg-slate-950 p-2.5 rounded-lg border border-slate-900 text-[10px] font-mono overflow-x-auto text-teal-450 select-all max-h-40">
{`-- Create Scans Table
create table scans (
  id uuid primary key,
  disease_name text not null,
  confidence float8 not null,
  image_url text,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null,
  device_id uuid not null
);

-- Create Guidelines Table
create table guidelines (
  id text primary key, -- e.g., 'anthracnose'
  disease_name text not null,
  guidelines_en text not null,
  guidelines_bis text not null,
  color text default 'yellow' not null
);

-- Enable public RLS policies
alter table scans enable row level security;
alter table guidelines enable row level security;

create policy "Allow read guidelines" on guidelines for select using (true);
create policy "Allow insert scans" on scans for insert with check (true);
create policy "Allow read scans" on scans for select using (true);
create policy "Allow delete scans" on scans for delete using (true);`}
      </pre>
    </div>
  );
}
