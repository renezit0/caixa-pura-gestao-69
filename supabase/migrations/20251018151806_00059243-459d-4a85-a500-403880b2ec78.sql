-- Adicionar coluna username na tabela usuarios
ALTER TABLE public.usuarios 
ADD COLUMN IF NOT EXISTS username VARCHAR(50) UNIQUE;

-- Dropar a função antiga
DROP FUNCTION IF EXISTS public.authenticate_user(text, text);

-- Criar nova função de autenticação que aceita username ou email
CREATE OR REPLACE FUNCTION public.authenticate_user(user_identifier text, user_password text)
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
AS $function$
DECLARE
    user_record usuarios%ROWTYPE;
    result json;
BEGIN
    -- Buscar usuário por username ou email
    SELECT * INTO user_record 
    FROM usuarios 
    WHERE (username = user_identifier OR email = user_identifier) 
      AND ativo = true;
    
    -- Se usuário não encontrado
    IF NOT FOUND THEN
        RETURN json_build_object('success', false, 'message', 'Usuário não encontrado');
    END IF;
    
    -- Verificar senha
    IF user_record.senha_desconto = user_password THEN
        RETURN json_build_object(
            'success', true, 
            'user', json_build_object(
                'id', user_record.id,
                'email', user_record.email,
                'nome', user_record.nome,
                'username', user_record.username,
                'tipo_usuario', user_record.tipo_usuario
            )
        );
    ELSE
        RETURN json_build_object('success', false, 'message', 'Senha incorreta');
    END IF;
END;
$function$;

-- Inserir usuário flaviorene se não existir
INSERT INTO public.usuarios (nome, email, username, senha_desconto, tipo_usuario, ativo)
VALUES ('Flávio Renê', 'flavio@admin.com', 'flaviorene', '0549', 'admin', true)
ON CONFLICT (email) DO UPDATE 
SET username = 'flaviorene';