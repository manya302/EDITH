-- ============================================
-- NEXORA DATABASE SCHEMA
-- ============================================

-- 1. PROFILES
create table public.profiles (
    id uuid primary key references auth.users(id) on delete cascade,
    full_name text,
    email text,
    role text not null default 'candidate'
        check (role in ('candidate', 'admin')),
    created_at timestamptz not null default now()
);


-- 2. OPENINGS
create table public.openings (
    id uuid primary key default gen_random_uuid(),

    title text not null,
    description text,
    requirements text,

    skills jsonb,
    must_have jsonb,
    nice_to_have jsonb,

    deadline timestamptz,

    status text not null default 'open'
        check (status in ('open', 'closed', 'draft')),

    created_by uuid not null
        references public.profiles(id)
        on delete cascade,

    created_at timestamptz not null default now()
);


-- 3. RESUMES
create table public.resumes (
    id uuid primary key default gen_random_uuid(),

    candidate_id uuid not null
        references public.profiles(id)
        on delete cascade,

    resume_url text not null,

    parsed_data jsonb,

    created_at timestamptz not null default now()
);


-- 4. APPLICATIONS
create table public.applications (
    id uuid primary key default gen_random_uuid(),

    candidate_id uuid not null
        references public.profiles(id)
        on delete cascade,

    opening_id uuid not null
        references public.openings(id)
        on delete cascade,

    resume_url text,

    application_status text not null default 'applied'
        check (
            application_status in (
                'applied',
                'shortlisted',
                'rejected',
                'selected'
            )
        ),

    match_score numeric(5,2),

    must_have_coverage numeric(5,2),

    strengths jsonb,
    gaps jsonb,

    created_at timestamptz not null default now(),

    unique(candidate_id, opening_id)
);
