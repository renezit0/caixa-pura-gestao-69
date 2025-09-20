-- Criar usuário no Supabase Auth
-- Como não podemos inserir diretamente na auth.users, vamos ajustar o sistema para usar a tabela usuarios customizada

-- Primeiro, vamos garantir que temos uma função para autenticação customizada
CREATE OR REPLACE FUNCTION authenticate_user(user_email text, user_password text)
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    user_record usuarios%ROWTYPE;
    result json;
BEGIN
    -- Buscar usuário pela email
    SELECT * INTO user_record 
    FROM usuarios 
    WHERE email = user_email AND ativo = true;
    
    -- Se usuário não encontrado
    IF NOT FOUND THEN
        RETURN json_build_object('success', false, 'message', 'Usuário não encontrado');
    END IF;
    
    -- Verificar senha (assumindo que a senha está em texto simples por enquanto)
    IF user_record.senha_desconto = user_password THEN
        RETURN json_build_object(
            'success', true, 
            'user', json_build_object(
                'id', user_record.id,
                'email', user_record.email,
                'nome', user_record.nome,
                'tipo_usuario', user_record.tipo_usuario
            )
        );
    ELSE
        RETURN json_build_object('success', false, 'message', 'Senha incorreta');
    END IF;
END;
$$;