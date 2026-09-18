SELECT column_name
FROM information_schema.columns
WHERE table_schema = 'public'
  AND table_name = 'activities'
  AND column_name = 'policyId';

SELECT table_name
FROM information_schema.tables
WHERE table_schema = 'public'
  AND table_name = 'policies';
