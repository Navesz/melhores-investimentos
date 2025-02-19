import { NextResponse } from 'next/server';
import axios from 'axios';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { stock } = body;

    const response = await axios.post(
      'https://api.anthropic.com/v1/messages',
      {
        model: 'claude-3-5-sonnet-20241022',
        max_tokens: 4000,
        messages: [
          {
            role: "user",
            content: `Analise detalhadamente a ação ${stock.papel} com base nos seguintes indicadores fundamentalistas:

P/L: ${stock.pl}
P/VP: ${stock.pvp}
ROE: ${stock.roe}%
Dividend Yield: ${stock.divYield}%
Dívida Bruta/Patrimônio: ${stock.divBruta}
Crescimento da Receita: ${stock.crescRec}%
Margem Líquida: ${stock.margLiq}%
ROIC: ${stock.roic}%

Forneça:
1. Visão geral da saúde financeira
2. Análise dos múltiplos (P/L e P/VP)
3. Análise da rentabilidade (ROE, Margem Líquida e ROIC)
4. Análise da distribuição de dividendos
5. Análise do endividamento
6. Pontos fortes e fracos
7. Riscos e oportunidades
8. Recomendação final (Compra/Venda/Neutro)

Seja objetivo e use dados concretos em sua análise.`
          }
        ]
      },
      {
        headers: {
          'Content-Type': 'application/json',
          'anthropic-version': '2023-06-01',
          'x-api-key': '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'
        }
      }
    );

    if (response.data && response.data.content) {
      return NextResponse.json({ 
        analysis: response.data.content 
      });
    } else {
      console.error('Resposta inesperada:', response.data);
      throw new Error('Formato de resposta inválido da API Claude');
    }
  } catch (error) {
    console.error('Erro na análise profunda:', error.response?.data || error.message);
    return NextResponse.json(
      { 
        error: 'Erro ao realizar análise profunda', 
        details: error.response?.data || error.message 
      },
      { status: 500 }
    );
  }
} 