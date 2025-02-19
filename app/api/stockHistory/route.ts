import { NextResponse } from 'next/server';
import axios from 'axios';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const symbol = searchParams.get('symbol');
  
  // Adicionar .SA para ações brasileiras
  const yahooSymbol = `${symbol}.SA`;
  
  try {
    const response = await axios.get(
      `https://query2.finance.yahoo.com/v8/finance/chart/${yahooSymbol}?interval=1d&range=1y`
    );

    const timestamps = response.data.chart.result[0].timestamp;
    const prices = response.data.chart.result[0].indicators.quote[0].close;

    const historicalData = timestamps.map((timestamp: number, index: number) => ({
      date: new Date(timestamp * 1000).toLocaleDateString('pt-BR'),
      price: prices[index]
    }));

    return NextResponse.json(historicalData);
  } catch (error) {
    console.error('Erro ao buscar dados históricos:', error);
    return NextResponse.json({ error: 'Erro ao buscar dados históricos' }, { status: 500 });
  }
} 