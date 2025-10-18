-- Criar tabela de notificações
CREATE TABLE public.notificacoes (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  titulo TEXT NOT NULL,
  mensagem TEXT NOT NULL,
  tipo VARCHAR(50) NOT NULL DEFAULT 'info', -- info, warning, error, success
  lida BOOLEAN NOT NULL DEFAULT false,
  usuario_id UUID REFERENCES public.usuarios(id),
  link TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Criar tabela de atividades
CREATE TABLE public.atividades (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  tipo VARCHAR(50) NOT NULL, -- venda, produto, cliente, estoque, etc
  descricao TEXT NOT NULL,
  detalhes TEXT,
  usuario_id UUID REFERENCES public.usuarios(id),
  referencia_id UUID, -- ID da venda, produto, etc
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.notificacoes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.atividades ENABLE ROW LEVEL SECURITY;

-- Policies para notificações
CREATE POLICY "Allow all operations on notificacoes" 
ON public.notificacoes 
FOR ALL 
USING (true)
WITH CHECK (true);

-- Policies para atividades
CREATE POLICY "Allow all operations on atividades" 
ON public.atividades 
FOR ALL 
USING (true)
WITH CHECK (true);

-- Criar índices para performance
CREATE INDEX idx_notificacoes_usuario ON public.notificacoes(usuario_id);
CREATE INDEX idx_notificacoes_lida ON public.notificacoes(lida);
CREATE INDEX idx_atividades_created_at ON public.atividades(created_at DESC);

-- Função para criar notificação de estoque baixo
CREATE OR REPLACE FUNCTION public.criar_notificacao_estoque_baixo()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.estoque_atual <= NEW.estoque_minimo AND (OLD.estoque_atual IS NULL OR OLD.estoque_atual > OLD.estoque_minimo) THEN
    INSERT INTO public.notificacoes (titulo, mensagem, tipo)
    VALUES (
      'Estoque Baixo',
      'O produto "' || NEW.nome || '" está com estoque baixo (' || NEW.estoque_atual || ' unidades)',
      'warning'
    );
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

-- Trigger para notificar estoque baixo
CREATE TRIGGER trigger_notificacao_estoque_baixo
AFTER INSERT OR UPDATE ON public.produtos
FOR EACH ROW
EXECUTE FUNCTION public.criar_notificacao_estoque_baixo();

-- Função para registrar atividade de venda
CREATE OR REPLACE FUNCTION public.registrar_atividade_venda()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.atividades (tipo, descricao, usuario_id, referencia_id)
  VALUES (
    'venda',
    'Nova venda realizada - ' || NEW.numero_venda,
    NEW.usuario_id,
    NEW.id
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

-- Trigger para registrar atividades de venda
CREATE TRIGGER trigger_atividade_venda
AFTER INSERT ON public.vendas
FOR EACH ROW
EXECUTE FUNCTION public.registrar_atividade_venda();

-- Função para registrar atividade de produto
CREATE OR REPLACE FUNCTION public.registrar_atividade_produto()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    INSERT INTO public.atividades (tipo, descricao, referencia_id)
    VALUES (
      'produto',
      'Produto cadastrado: ' || NEW.nome,
      NEW.id
    );
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

-- Trigger para registrar atividades de produto
CREATE TRIGGER trigger_atividade_produto
AFTER INSERT ON public.produtos
FOR EACH ROW
EXECUTE FUNCTION public.registrar_atividade_produto();