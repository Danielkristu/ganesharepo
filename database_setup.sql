-- Documents Table
CREATE TABLE documents (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    title TEXT NOT NULL,
    abstract TEXT,
    author TEXT NOT NULL,
    category TEXT NOT NULL,
    faculty TEXT,
    major TEXT,
    file_url TEXT NOT NULL,
    material_type TEXT NOT NULL DEFAULT 'file',
    thumbnail_url TEXT,
    year INTEGER,
    publish_mode TEXT NOT NULL DEFAULT 'public',
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Webinar Rooms Table
CREATE TABLE webinar_rooms (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    title TEXT NOT NULL,
    description TEXT,
    host_id UUID NOT NULL, -- references auth.users(id) if needed
    status TEXT NOT NULL DEFAULT 'scheduled',
    room_url TEXT,
    scheduled_at TIMESTAMPTZ NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Webinar Questions Table
CREATE TABLE webinar_questions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    webinar_id UUID NOT NULL REFERENCES webinar_rooms(id) ON DELETE CASCADE,
    user_id UUID NOT NULL, -- references auth.users(id) if needed
    question TEXT NOT NULL,
    upvotes INTEGER NOT NULL DEFAULT 0,
    answered BOOLEAN NOT NULL DEFAULT FALSE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Enable RLS (Row Level Security) - Optional but recommended
ALTER TABLE documents ENABLE ROW LEVEL SECURITY;
ALTER TABLE webinar_rooms ENABLE ROW LEVEL SECURITY;
ALTER TABLE webinar_questions ENABLE ROW LEVEL SECURITY;

-- Allow all access for now (since we use backend FastAPI to handle security)
CREATE POLICY "Allow all access to documents" ON documents FOR ALL USING (true);
CREATE POLICY "Allow all access to webinar_rooms" ON webinar_rooms FOR ALL USING (true);
CREATE POLICY "Allow all access to webinar_questions" ON webinar_questions FOR ALL USING (true);
