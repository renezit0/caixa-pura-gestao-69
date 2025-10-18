-- Atualizar senha do usuário flaviorene para 0549
UPDATE public.usuarios 
SET senha_desconto = '0549'
WHERE username = 'flaviorene' OR email = 'flavio@admin.com';