-- Adicionar campo matrícula na tabela usuarios
ALTER TABLE usuarios ADD COLUMN IF NOT EXISTS matricula character varying;

-- Criar índice único para garantir que não haja matrículas duplicadas
CREATE UNIQUE INDEX IF NOT EXISTS usuarios_matricula_key ON usuarios(matricula) WHERE matricula IS NOT NULL;