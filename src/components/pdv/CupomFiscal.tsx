import React from 'react';
import { format } from 'date-fns';

interface CupomFiscalProps {
  venda: {
    id: string;
    numero_venda: number;
    created_at: string;
    subtotal: number;
    desconto: number;
    total: number;
    forma_pagamento: string;
  };
  itens: Array<{
    nome: string;
    quantidade: number;
    preco_unitario: number;
    desconto_item: number;
    subtotal: number;
  }>;
  cliente?: {
    nome: string;
    cpf?: string;
    telefone?: string;
  };
  empresa: {
    nome: string;
    cnpj?: string;
    endereco?: string;
    telefone?: string;
  };
}

export const CupomFiscal: React.FC<CupomFiscalProps> = ({ venda, itens, cliente, empresa }) => {
  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(value);
  };

  const formatPaymentMethod = (method: string) => {
    const methods: Record<string, string> = {
      'dinheiro': 'DINHEIRO',
      'cartao_debito': 'CARTÃO DE DÉBITO',
      'cartao_credito': 'CARTÃO DE CRÉDITO',
      'pix': 'PIX'
    };
    return methods[method] || method.toUpperCase();
  };

  return (
    <div className="cupom-fiscal" style={{
      width: '80mm',
      padding: '5mm',
      fontFamily: 'monospace',
      fontSize: '12px',
      lineHeight: '1.4',
      color: '#000',
      backgroundColor: '#fff'
    }}>
      {/* Cabeçalho da Empresa */}
      <div style={{ textAlign: 'center', marginBottom: '10px', borderBottom: '1px dashed #000', paddingBottom: '10px' }}>
        <div style={{ fontSize: '16px', fontWeight: 'bold', marginBottom: '5px' }}>
          {empresa.nome}
        </div>
        {empresa.cnpj && (
          <div style={{ fontSize: '11px' }}>CNPJ: {empresa.cnpj}</div>
        )}
        {empresa.endereco && (
          <div style={{ fontSize: '11px' }}>{empresa.endereco}</div>
        )}
        {empresa.telefone && (
          <div style={{ fontSize: '11px' }}>Tel: {empresa.telefone}</div>
        )}
      </div>

      {/* Informações da Venda */}
      <div style={{ marginBottom: '10px', borderBottom: '1px dashed #000', paddingBottom: '10px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '11px' }}>
          <span>VENDA Nº:</span>
          <span style={{ fontWeight: 'bold' }}>{venda.numero_venda}</span>
        </div>
        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '11px' }}>
          <span>DATA/HORA:</span>
          <span>{format(new Date(venda.created_at), 'dd/MM/yyyy HH:mm:ss')}</span>
        </div>
      </div>

      {/* Dados do Cliente */}
      {cliente && (
        <div style={{ marginBottom: '10px', borderBottom: '1px dashed #000', paddingBottom: '10px' }}>
          <div style={{ fontSize: '12px', fontWeight: 'bold', marginBottom: '3px' }}>
            CLIENTE
          </div>
          <div style={{ fontSize: '11px' }}>Nome: {cliente.nome}</div>
          {cliente.cpf && (
            <div style={{ fontSize: '11px' }}>CPF: {cliente.cpf}</div>
          )}
          {cliente.telefone && (
            <div style={{ fontSize: '11px' }}>Tel: {cliente.telefone}</div>
          )}
        </div>
      )}

      {/* Itens da Venda */}
      <div style={{ marginBottom: '10px', borderBottom: '1px dashed #000', paddingBottom: '10px' }}>
        <div style={{ fontSize: '12px', fontWeight: 'bold', marginBottom: '5px' }}>
          ITENS
        </div>
        {itens.map((item, index) => (
          <div key={index} style={{ marginBottom: '8px', fontSize: '11px' }}>
            <div style={{ fontWeight: 'bold' }}>{item.nome}</div>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span>
                {item.quantidade} x {formatCurrency(item.preco_unitario)}
              </span>
              <span style={{ fontWeight: 'bold' }}>
                {formatCurrency(item.preco_unitario * item.quantidade)}
              </span>
            </div>
            {item.desconto_item > 0 && (
              <div style={{ display: 'flex', justifyContent: 'space-between', color: '#666' }}>
                <span>Desconto:</span>
                <span>-{formatCurrency(item.desconto_item)}</span>
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Totais */}
      <div style={{ marginBottom: '10px', borderBottom: '1px dashed #000', paddingBottom: '10px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '11px', marginBottom: '3px' }}>
          <span>SUBTOTAL:</span>
          <span>{formatCurrency(venda.subtotal)}</span>
        </div>
        {venda.desconto > 0 && (
          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '11px', marginBottom: '3px' }}>
            <span>DESCONTO:</span>
            <span>-{formatCurrency(venda.desconto)}</span>
          </div>
        )}
        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '16px', fontWeight: 'bold', marginTop: '5px' }}>
          <span>TOTAL:</span>
          <span>{formatCurrency(venda.total)}</span>
        </div>
      </div>

      {/* Forma de Pagamento */}
      <div style={{ marginBottom: '10px', borderBottom: '1px dashed #000', paddingBottom: '10px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px' }}>
          <span>FORMA DE PAGAMENTO:</span>
          <span style={{ fontWeight: 'bold' }}>{formatPaymentMethod(venda.forma_pagamento)}</span>
        </div>
      </div>

      {/* Rodapé */}
      <div style={{ textAlign: 'center', fontSize: '11px', marginTop: '15px' }}>
        <div style={{ marginBottom: '5px' }}>OBRIGADO PELA PREFERÊNCIA!</div>
        <div>VOLTE SEMPRE</div>
      </div>
    </div>
  );
};
