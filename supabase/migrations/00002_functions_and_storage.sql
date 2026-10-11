-- Auth & Invitation helper functions and Storage setup

-- Function to validate invite code
CREATE OR REPLACE FUNCTION validate_invite_code(p_code TEXT)
RETURNS TABLE (
  valid BOOLEAN,
  role user_role,
  message TEXT
) AS $$
DECLARE
  v_invite RECORD;
BEGIN
  SELECT * INTO v_invite
  FROM invitations
  WHERE code = p_code;

  IF NOT FOUND THEN
    RETURN QUERY SELECT false, 'member'::user_role, 'Invalid invitation code';
    RETURN;
  END IF;

  IF v_invite.used_by IS NOT NULL THEN
    RETURN QUERY SELECT false, v_invite.role, 'Invitation code has already been used';
    RETURN;
  END IF;

  IF v_invite.expires_at < now() THEN
    RETURN QUERY SELECT false, v_invite.role, 'Invitation code has expired';
    RETURN;
  END IF;

  RETURN QUERY SELECT true, v_invite.role, 'Valid invitation code';
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to redeem invite code upon user signup
CREATE OR REPLACE FUNCTION redeem_invite(
  p_code TEXT,
  p_user_id UUID,
  p_email TEXT,
  p_full_name TEXT
)
RETURNS TABLE (
  success BOOLEAN,
  assigned_role user_role,
  error_message TEXT
) AS $$
DECLARE
  v_invite RECORD;
  v_assigned_role user_role;
BEGIN
  -- Lock row for update
  SELECT * INTO v_invite
  FROM invitations
  WHERE code = p_code
  FOR UPDATE;

  IF NOT FOUND THEN
    RETURN QUERY SELECT false, 'member'::user_role, 'Invitation code does not exist';
    RETURN;
  END IF;

  IF v_invite.used_by IS NOT NULL THEN
    RETURN QUERY SELECT false, v_invite.role, 'Invitation code has already been redeemed';
    RETURN;
  END IF;

  IF v_invite.expires_at < now() THEN
    RETURN QUERY SELECT false, v_invite.role, 'Invitation code has expired';
    RETURN;
  END IF;

  v_assigned_role := v_invite.role;

  -- Create profile
  INSERT INTO profiles (id, email, full_name, role)
  VALUES (p_user_id, p_email, p_full_name, v_assigned_role)
  ON CONFLICT (id) DO UPDATE
  SET full_name = EXCLUDED.full_name,
      role = v_assigned_role;

  -- Mark invitation as used
  UPDATE invitations
  SET used_by = p_user_id,
      used_at = now()
  WHERE code = p_code;

  -- Record audit log
  INSERT INTO audit_logs (actor_id, action, target, meta)
  VALUES (p_user_id, 'USER_REGISTERED_WITH_INVITE', p_user_id::text, jsonb_build_object('code', p_code, 'role', v_assigned_role));

  RETURN QUERY SELECT true, v_assigned_role, NULL::TEXT;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Storage setup for 'documents' bucket
INSERT INTO storage.buckets (id, name, public)
VALUES ('documents', 'documents', true)
ON CONFLICT (id) DO UPDATE SET public = true;

-- Storage policies
CREATE POLICY "Public can view documents in documents bucket"
  ON storage.objects FOR SELECT
  TO authenticated
  USING (bucket_id = 'documents');

CREATE POLICY "Executives can upload documents"
  ON storage.objects FOR INSERT
  TO authenticated
  WITH CHECK (
    bucket_id = 'documents' 
    AND EXISTS (
      SELECT 1 FROM profiles 
      WHERE id = auth.uid() 
      AND role IN ('president', 'vice_president', 'executive')
    )
  );
