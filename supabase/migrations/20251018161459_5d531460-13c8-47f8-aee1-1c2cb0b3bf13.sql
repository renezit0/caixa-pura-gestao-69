-- Corrigir search_path em todas as funções para segurança

-- 1. Função gerar_codigo_interno
CREATE OR REPLACE FUNCTION public.gerar_codigo_interno()
RETURNS text
LANGUAGE plpgsql
SET search_path = public
AS $$
DECLARE
  codigo TEXT;
  existe BOOLEAN := TRUE;
  numero INTEGER;
BEGIN
  WHILE existe LOOP
    numero := FLOOR(RANDOM() * 99990 + 10)::INTEGER;
    codigo := numero::TEXT;
    SELECT EXISTS(SELECT 1 FROM produtos WHERE codigo_interno = codigo) INTO existe;
  END LOOP;
  RETURN codigo;
END;
$$;

-- 2. Função trigger_gerar_codigo
CREATE OR REPLACE FUNCTION public.trigger_gerar_codigo()
RETURNS trigger
LANGUAGE plpgsql
SET search_path = public
AS $$
BEGIN
  IF NEW.codigo_interno IS NULL OR NEW.codigo_interno = '' THEN
    NEW.codigo_interno := gerar_codigo_interno();
  END IF;
  RETURN NEW;
END;
$$;

-- 3. Função atualizar_estoque_venda
CREATE OR REPLACE FUNCTION public.atualizar_estoque_venda()
RETURNS trigger
LANGUAGE plpgsql
SET search_path = public
AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    UPDATE produtos 
    SET estoque_atual = estoque_atual - NEW.quantidade
    WHERE id = NEW.produto_id;
    
    INSERT INTO movimentacao_estoque (produto_id, tipo_movimentacao, quantidade, valor_unitario, observacao)
    VALUES (NEW.produto_id, 'saida', NEW.quantidade, NEW.preco_unitario, 'Venda #' || NEW.venda_id);
  END IF;
  RETURN NEW;
END;
$$;

-- 4. Função authenticate_user
CREATE OR REPLACE FUNCTION public.authenticate_user(user_identifier text, user_password text)
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
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
                'tipo_usuario', user_record.tipo_usuario
            )
        );
    ELSE
        RETURN json_build_object('success', false, 'message', 'Senha incorreta');
    END IF;
END;
$$;