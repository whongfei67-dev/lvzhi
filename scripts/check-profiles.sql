-- 检查 profiles 完整结构
SELECT column_name, data_type FROM information_schema.columns WHERE table_name = 'profiles';
