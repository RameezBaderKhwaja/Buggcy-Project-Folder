-- Enable Row Level Security on all tables
ALTER TABLE "User" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "SecurityLog" ENABLE ROW LEVEL SECURITY;

-- Create policies for User table
-- Users can only see their own data
CREATE POLICY "Users can view own profile" ON "User"
    FOR SELECT USING (auth.uid()::text = id);

-- Users can update their own data
CREATE POLICY "Users can update own profile" ON "User"
    FOR UPDATE USING (auth.uid()::text = id);

-- Only admins can see all users (for admin dashboard)
CREATE POLICY "Admins can view all users" ON "User"
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM "User" 
            WHERE id = auth.uid()::text 
            AND role = 'ADMIN'
        )
    );

-- Create policies for SecurityLog table
-- Users can only see their own security logs
CREATE POLICY "Users can view own security logs" ON "SecurityLog"
    FOR SELECT USING (auth.uid()::text = "userId");

-- Only admins can see all security logs
CREATE POLICY "Admins can view all security logs" ON "SecurityLog"
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM "User" 
            WHERE id = auth.uid()::text 
            AND role = 'ADMIN'
        )
    );

-- Allow system to insert security logs
CREATE POLICY "System can insert security logs" ON "SecurityLog"
    FOR INSERT WITH CHECK (true);

-- Grant necessary permissions
GRANT USAGE ON SCHEMA public TO authenticated;
GRANT ALL ON "User" TO authenticated;
GRANT ALL ON "SecurityLog" TO authenticated; 