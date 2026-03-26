CREATE TABLE IF NOT EXISTS admin_user_notes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    admin_id UUID NOT NULL REFERENCES profiles(id),
    note TEXT NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_admin_user_notes_user ON admin_user_notes(user_id);

-- Add RLS
ALTER TABLE admin_user_notes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Super admins can manage all notes" 
ON admin_user_notes 
FOR ALL USING (
  EXISTS (
    SELECT 1 FROM profiles
    WHERE profiles.id = auth.uid() AND profiles.role = 'super_admin'
  )
);
