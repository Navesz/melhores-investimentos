import { NextResponse } from 'next/server';
import axios from 'axios';
import * as cheerio from 'cheerio';

export async function GET() {
  try {
    const response = await axios.get('https://www.fundamentus.com.br/resultado.php', {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
      }
    });

    const $ = cheerio.load(response.data);
    const stocks: any[] = [];

    $('table tr:not(:first-child)').each((_, element) => {
      const tds = $(element).find('td');
      
      const stock = {
        papel: $(tds[0]).text().trim(),
        cotacao: $(tds[1]).text().trim(),
        pl: $(tds[2]).text().trim(),
        pvp: $(tds[3]).text().trim(),
        psr: $(tds[4]).text().trim(),
        divYield: $(tds[5]).text().trim(),
        pAtivo: $(tds[6]).text().trim(),
        pCapGiro: $(tds[7]).text().trim(),
        pEbit: $(tds[8]).text().trim(),
        pAtivCircLiq: $(tds[9]).text().trim(),
        evEbit: $(tds[10]).text().trim(),
        evEbitda: $(tds[11]).text().trim(),
        margEbit: $(tds[12]).text().trim(),
        margLiq: $(tds[13]).text().trim(),
        liqCorr: $(tds[14]).text().trim(),
        roic: $(tds[15]).text().trim(),
        roe: $(tds[16]).text().trim(),
        liq2m: $(tds[17]).text().trim(),
        patriLiq: $(tds[18]).text().trim(),
        divBruta: $(tds[19]).text().trim(),
        crescRec: $(tds[20]).text().trim(),
      };

      stocks.push(stock);
    });

    return NextResponse.json(stocks);
  } catch (error) {
    console.error('Erro ao buscar dados:', error);
    return NextResponse.json({ error: 'Erro ao buscar dados' }, { status: 500 });
  }
}