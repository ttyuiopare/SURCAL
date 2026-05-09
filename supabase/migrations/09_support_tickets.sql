-- Create Support Tickets Table
CREATE TABLE support_tickets (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES auth.users(id),
    name TEXT NOT NULL,
    email TEXT NOT NULL,
    subject TEXT NOT NULL,
    message TEXT NOT NULL,
    status TEXT NOT NULL DEFAULT 'open',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE support_tickets ENABLE ROW LEVEL SECURITY;

-- Allow authenticated users to create their own tickets
CREATE POLICY "Users can create support tickets"
ON support_tickets
FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = user_id);

-- Allow authenticated users to view their own tickets
CREATE POLICY "Users can view their own tickets"
ON support_tickets
FOR SELECT
TO authenticated
USING (auth.uid() = user_id);

-- Also allow anon users to create tickets (for non-logged in users)
CREATE POLICY "Anon can create support tickets"
ON support_tickets
FOR INSERT
TO anon
WITH CHECK (true);
