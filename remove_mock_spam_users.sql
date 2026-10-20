-- ==============================================================================
-- SCRIPT DE REMOÇÃO DE USUÁRIOS FALSOS / MOCKUPS / BOTS (public.users e auth.users)
-- ==============================================================================

-- 1. Remove da tabela public.users os registros com e-mails ou nomes de bots/mockups
DELETE FROM public.users
WHERE LOWER(TRIM(email)) IN (
  'hbi@vi-team.dk',
  'vca@victorycheeracademy.com',
  'jessica.hilscher@apexcos.com',
  'marco.weimer@cyderes.com',
  'alfonso.m.hernandez@ogarriowireless.com',
  'mirzahashim@msn.com',
  'maximilian.perdue.1@us.af.mil'
)
OR LOWER(TRIM(name)) IN (
  'pbedhkydnyerscox',
  'eukjnlqgskpwheuygxw',
  'qsmgjmnuohyjuvjymjj',
  'qsmgjmnuohyjujvymyjj',
  'ldzwmvpqfpcobmpdvadl',
  'oieufzqqkdvtylkkjswbbcks',
  'hthobmaprnnntaczlx',
  'ldceeqtjmquwadjvvfbakf'
)
-- Remove também nomes gerados por bots (uma única palavra sem espaço >= 12 letras com maiúsculas aleatórias no meio)
OR (
  TRIM(name) ~ '^[A-Za-z]{12,}$'
  AND TRIM(name) ~ '[a-z].*[A-Z].*[a-z].*[A-Z]'
);

-- 2. Remove também de auth.users (caso tenham sido criados via formulário público)
DELETE FROM auth.users
WHERE LOWER(TRIM(email)) IN (
  'hbi@vi-team.dk',
  'vca@victorycheeracademy.com',
  'jessica.hilscher@apexcos.com',
  'marco.weimer@cyderes.com',
  'alfonso.m.hernandez@ogarriowireless.com',
  'mirzahashim@msn.com',
  'maximilian.perdue.1@us.af.mil'
);
