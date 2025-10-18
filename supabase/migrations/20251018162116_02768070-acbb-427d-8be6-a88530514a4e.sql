-- Atualizar função authenticate_user para retornar matrícula
CREATE OR REPLACE FUNCTION public.authenticate_user(user_identifier text, user_password text)
 RETURNS json
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path = 'public'
AS $function$
DECLARE
    user_record usuarios%ROWTYPE;
    result json;
BEGIN
    SELECT * INTO user_record 
    FROM usuarios 
    WHERE (username = user_identifier OR email = user_identifier) 
      AND ativo = true;
    
    IF NOT FOUND THEN
        RETURN json_build_object('success', false, 'message', 'Usuário não encontrado');
    END IF;
    
    IF user_record.senha_desconto = user_password THEN
        RETURN json_build_object(
            'success', true, 
            'user', json_build_object(
                'id', user_record.id,
                'email', user_record.email,
                'nome', user_record.nome,
                'username', user_record.username,
                'matricula', user_record.matricula,
                'tipo_usuario', user_record.tipo_usuario
            )
        );
    ELSE
        RETURN json_build_object('success', false, 'message', 'Senha incorreta');
    END IF;
END;
$function$;