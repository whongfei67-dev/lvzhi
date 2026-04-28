-- Migrate role value from 'lawyer' to 'creator'
UPDATE profiles SET role = 'creator' WHERE role = 'lawyer';

ALTER TABLE profiles DROP CONSTRAINT IF EXISTS profiles_role_check;
ALTER TABLE profiles ADD CONSTRAINT profiles_role_check
  CHECK (role IN ('seeker','creator','recruiter','client','admin'));
