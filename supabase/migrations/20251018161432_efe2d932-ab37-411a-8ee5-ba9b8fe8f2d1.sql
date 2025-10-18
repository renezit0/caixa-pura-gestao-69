-- Atualizar função para gerar códigos internos menores (2 a 5 dígitos)
CREATE OR REPLACE FUNCTION public.gerar_codigo_interno()
RETURNS text
LANGUAGE plpgsql
AS $$
DECLARE
  codigo TEXT;
  existe BOOLEAN := TRUE;
  numero INTEGER;
BEGIN
  WHILE existe LOOP
    -- Gera número aleatório entre 10 (2 dígitos) e 99999 (5 dígitos)
    numero := FLOOR(RANDOM() * 99990 + 10)::INTEGER;
    codigo := numero::TEXT;
    
    -- Verifica se já existe
    SELECT EXISTS(SELECT 1 FROM produtos WHERE codigo_interno = codigo) INTO existe;
  END LOOP;
  
  RETURN codigo;
END;
$$;