-- 工作台个人资料扩展字段（姓名/昵称/单位/地址等）
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS nickname TEXT;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS work_organization TEXT;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS contact_address TEXT;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS creator_application_reason TEXT;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS requested_role TEXT;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS verification_status TEXT;
