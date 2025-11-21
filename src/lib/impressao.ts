import { createRoot } from 'react-dom/client';
import { CupomFiscal } from '@/components/pdv/CupomFiscal';
import React from 'react';

interface DadosVenda {
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

export const imprimirCupomFiscal = (dados: DadosVenda) => {
  // Criar um iframe oculto para impressão
  const iframe = document.createElement('iframe');
  iframe.style.position = 'absolute';
  iframe.style.width = '0';
  iframe.style.height = '0';
  iframe.style.border = 'none';
  document.body.appendChild(iframe);

  const iframeDoc = iframe.contentDocument || iframe.contentWindow?.document;
  if (!iframeDoc) {
    console.error('Não foi possível acessar o documento do iframe');
    return;
  }

  // Escrever o HTML no iframe
  iframeDoc.open();
  iframeDoc.write(`
    <!DOCTYPE html>
    <html>
      <head>
        <meta charset="utf-8">
        <title>Cupom Fiscal</title>
        <style>
          @page {
            size: 80mm auto;
            margin: 0;
          }
          
          @media print {
            body {
              margin: 0;
              padding: 0;
            }
            
            .cupom-fiscal {
              page-break-after: always;
            }
          }
          
          body {
            margin: 0;
            padding: 0;
            font-family: 'Courier New', monospace;
          }
          
          * {
            -webkit-print-color-adjust: exact !important;
            print-color-adjust: exact !important;
          }
        </style>
      </head>
      <body>
        <div id="cupom-root"></div>
      </body>
    </html>
  `);
  iframeDoc.close();

  // Aguardar o documento estar pronto
  iframe.onload = () => {
    const cupomRoot = iframeDoc.getElementById('cupom-root');
    if (!cupomRoot) {
      console.error('Elemento cupom-root não encontrado');
      return;
    }

    // Renderizar o componente React no iframe
    const root = createRoot(cupomRoot);
    root.render(
      React.createElement(CupomFiscal, {
        venda: dados.venda,
        itens: dados.itens,
        cliente: dados.cliente,
        empresa: dados.empresa
      })
    );

    // Aguardar a renderização e então imprimir
    setTimeout(() => {
      iframe.contentWindow?.print();
      
      // Remover o iframe após a impressão
      setTimeout(() => {
        document.body.removeChild(iframe);
      }, 1000);
    }, 500);
  };
};
