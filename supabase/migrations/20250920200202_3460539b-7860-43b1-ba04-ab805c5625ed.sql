-- Criação do sistema completo de gestão/PDV

-- Tabela de usuários do sistema (vendedores, admins)
CREATE TABLE public.usuarios (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  auth_user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  nome VARCHAR(100) NOT NULL,
  email VARCHAR(255) UNIQUE NOT NULL,
  tipo_usuario VARCHAR(20) NOT NULL CHECK (tipo_usuario IN ('admin', 'vendedor')),
  ativo BOOLEAN DEFAULT true,
  senha_desconto VARCHAR(100) DEFAULT 'abacate',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Tabela de categorias
CREATE TABLE public.categorias (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  nome VARCHAR(100) NOT NULL,
  descricao TEXT,
  ativo BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Tabela de fornecedores
CREATE TABLE public.fornecedores (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  nome VARCHAR(200) NOT NULL,
  cnpj VARCHAR(18),
  cpf VARCHAR(14),
  email VARCHAR(255),
  telefone VARCHAR(20),
  endereco TEXT,
  cidade VARCHAR(100),
  estado VARCHAR(2),
  cep VARCHAR(10),
  ativo BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Tabela de clientes
CREATE TABLE public.clientes (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  nome VARCHAR(200) NOT NULL,
  cpf VARCHAR(14),
  email VARCHAR(255),
  telefone VARCHAR(20),
  endereco TEXT,
  cidade VARCHAR(100),
  estado VARCHAR(2),
  cep VARCHAR(10),
  data_nascimento DATE,
  ativo BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Tabela de produtos
CREATE TABLE public.produtos (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  codigo_interno VARCHAR(10) UNIQUE NOT NULL,
  codigo_barras VARCHAR(50),
  nome VARCHAR(200) NOT NULL,
  descricao TEXT,
  categoria_id UUID REFERENCES public.categorias(id),
  fornecedor_id UUID REFERENCES public.fornecedores(id),
  preco_custo DECIMAL(10,2) DEFAULT 0,
  preco_venda DECIMAL(10,2) NOT NULL,
  estoque_atual INTEGER DEFAULT 0,
  estoque_minimo INTEGER DEFAULT 0,
  unidade_medida VARCHAR(10) DEFAULT 'UN',
  imagem_url TEXT,
  ativo BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Tabela de movimentação de estoque
CREATE TABLE public.movimentacao_estoque (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  produto_id UUID REFERENCES public.produtos(id) NOT NULL,
  fornecedor_id UUID REFERENCES public.fornecedores(id),
  tipo_movimentacao VARCHAR(20) NOT NULL CHECK (tipo_movimentacao IN ('entrada', 'saida', 'ajuste')),
  quantidade INTEGER NOT NULL,
  valor_unitario DECIMAL(10,2),
  valor_total DECIMAL(10,2),
  observacao TEXT,
  usuario_id UUID REFERENCES public.usuarios(id),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Tabela de vendas
CREATE TABLE public.vendas (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  numero_venda SERIAL,
  cliente_id UUID REFERENCES public.clientes(id),
  usuario_id UUID REFERENCES public.usuarios(id) NOT NULL,
  subtotal DECIMAL(10,2) NOT NULL,
  desconto DECIMAL(10,2) DEFAULT 0,
  total DECIMAL(10,2) NOT NULL,
  status VARCHAR(20) DEFAULT 'finalizada' CHECK (status IN ('aberta', 'finalizada', 'cancelada')),
  forma_pagamento VARCHAR(50),
  observacoes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Tabela de itens da venda
CREATE TABLE public.itens_venda (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  venda_id UUID REFERENCES public.vendas(id) ON DELETE CASCADE NOT NULL,
  produto_id UUID REFERENCES public.produtos(id) NOT NULL,
  quantidade INTEGER NOT NULL,
  preco_unitario DECIMAL(10,2) NOT NULL,
  desconto_item DECIMAL(10,2) DEFAULT 0,
  subtotal DECIMAL(10,2) NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Tabela de controle de caixa
CREATE TABLE public.caixa (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  usuario_id UUID REFERENCES public.usuarios(id) NOT NULL,
  data_abertura TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  data_fechamento TIMESTAMP WITH TIME ZONE,
  valor_inicial DECIMAL(10,2) DEFAULT 0,
  valor_vendas DECIMAL(10,2) DEFAULT 0,
  valor_final DECIMAL(10,2) DEFAULT 0,
  status VARCHAR(20) DEFAULT 'aberto' CHECK (status IN ('aberto', 'fechado')),
  observacoes TEXT
);

-- Habilitar RLS em todas as tabelas
ALTER TABLE public.usuarios ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.categorias ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.fornecedores ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.clientes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.produtos ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.movimentacao_estoque ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.vendas ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.itens_venda ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.caixa ENABLE ROW LEVEL SECURITY;

-- Políticas RLS básicas (permitir tudo para usuários autenticados por enquanto)
CREATE POLICY "Permitir tudo para autenticados" ON public.usuarios FOR ALL USING (auth.uid() IS NOT NULL);
CREATE POLICY "Permitir tudo para autenticados" ON public.categorias FOR ALL USING (auth.uid() IS NOT NULL);
CREATE POLICY "Permitir tudo para autenticados" ON public.fornecedores FOR ALL USING (auth.uid() IS NOT NULL);
CREATE POLICY "Permitir tudo para autenticados" ON public.clientes FOR ALL USING (auth.uid() IS NOT NULL);
CREATE POLICY "Permitir tudo para autenticados" ON public.produtos FOR ALL USING (auth.uid() IS NOT NULL);
CREATE POLICY "Permitir tudo para autenticados" ON public.movimentacao_estoque FOR ALL USING (auth.uid() IS NOT NULL);
CREATE POLICY "Permitir tudo para autenticados" ON public.vendas FOR ALL USING (auth.uid() IS NOT NULL);
CREATE POLICY "Permitir tudo para autenticados" ON public.itens_venda FOR ALL USING (auth.uid() IS NOT NULL);
CREATE POLICY "Permitir tudo para autenticados" ON public.caixa FOR ALL USING (auth.uid() IS NOT NULL);

-- Função para gerar código interno automático
CREATE OR REPLACE FUNCTION gerar_codigo_interno()
RETURNS TEXT AS $$
DECLARE
  codigo TEXT;
  existe BOOLEAN := TRUE;
BEGIN
  WHILE existe LOOP
    codigo := LPAD(FLOOR(RANDOM() * 99999 + 1)::TEXT, 5, '0');
    SELECT EXISTS(SELECT 1 FROM produtos WHERE codigo_interno = codigo) INTO existe;
  END LOOP;
  RETURN codigo;
END;
$$ LANGUAGE plpgsql;

-- Trigger para gerar código automáticamente
CREATE OR REPLACE FUNCTION trigger_gerar_codigo()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.codigo_interno IS NULL OR NEW.codigo_interno = '' THEN
    NEW.codigo_interno := gerar_codigo_interno();
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER produtos_gerar_codigo
  BEFORE INSERT ON produtos
  FOR EACH ROW
  EXECUTE FUNCTION trigger_gerar_codigo();

-- Trigger para atualizar estoque em vendas
CREATE OR REPLACE FUNCTION atualizar_estoque_venda()
RETURNS TRIGGER AS $$
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
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_atualizar_estoque_venda
  AFTER INSERT ON itens_venda
  FOR EACH ROW
  EXECUTE FUNCTION atualizar_estoque_venda();

-- Inserir dados iniciais
INSERT INTO categorias (nome, descricao) VALUES 
('Alimentação', 'Produtos alimentícios'),
('Bebidas', 'Bebidas em geral'),
('Limpeza', 'Produtos de limpeza'),
('Higiene', 'Produtos de higiene pessoal');

-- Inserir usuário administrador padrão
INSERT INTO usuarios (nome, email, tipo_usuario, senha_desconto) VALUES 
('Flavio', 'flavio@admin.com', 'admin', 'abacate');

-- Inserir alguns produtos de exemplo
INSERT INTO produtos (nome, descricao, preco_venda, estoque_atual, categoria_id) 
SELECT 
  'Produto Exemplo ' || generate_series,
  'Descrição do produto ' || generate_series,
  (RANDOM() * 50 + 10)::DECIMAL(10,2),
  (RANDOM() * 100 + 10)::INTEGER,
  (SELECT id FROM categorias ORDER BY RANDOM() LIMIT 1)
FROM generate_series(1, 10);