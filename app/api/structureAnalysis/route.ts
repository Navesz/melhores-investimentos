import { NextResponse } from 'next/server';
import axios from 'axios';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { rawAnalysis, stock } = body;

    if (!rawAnalysis || typeof rawAnalysis !== 'string') {
      throw new Error('Análise inválida ou vazia');
    }

    const response = await axios.post(
      'https://api.anthropic.com/v1/messages',
      {
        model: 'claude-3-5-sonnet-20241022',
        max_tokens: 4000,
        messages: [
          {
            role: "user",
            content: `Analise o seguinte texto sobre a ação ${stock} e estruture uma resposta em formato JSON:

${rawAnalysis}

Forneça a resposta APENAS no seguinte formato JSON, sem texto adicional:
{
  "overview": "Resumo geral em um parágrafo",
  "positivePoints": ["Lista de pontos positivos"],
  "negativePoints": ["Lista de pontos de atenção"],
  "keyMetrics": [
    {
      "category": "Nome da categoria",
      "metrics": [
        {
          "name": "Nome do indicador",
          "value": "Valor",
          "evaluation": "Avaliação (Positivo/Neutro/Negativo)"
        }
      ]
    }
  ],
  "recommendation": {
    "verdict": "COMPRA/VENDA/NEUTRO",
    "reasoning": ["Lista de justificativas"]
  }
}`
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

    if (response.data.content && Array.isArray(response.data.content)) {
      const content = response.data.content[0]?.text || '';
      
      // Tenta encontrar o JSON na resposta
      const jsonMatch = content.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        try {
          const structuredAnalysis = JSON.parse(jsonMatch[0]);
          return NextResponse.json(structuredAnalysis);
        } catch (parseError) {
          console.error('Erro ao fazer parse do JSON:', parseError);
          throw new Error('JSON inválido na resposta');
        }
      }
    }

    console.error('Resposta inesperada:', response.data);
    throw new Error('Formato de resposta inválido');
  } catch (error) {
    console.error('Erro na estruturação da análise:', error);
    return NextResponse.json(
      { 
        error: 'Erro ao estruturar análise', 
        details: error.message,
        rawResponse: error.response?.data 
      },
      { status: 500 }
    );
  }
} 