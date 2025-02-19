'use client';

import { useEffect, useState } from 'react';
import axios from 'axios';
import { load } from 'cheerio';
import dynamic from 'next/dynamic';
import StockDetailModal from './components/StockDetailModal';
import { useRouter } from 'next/navigation';
import { useTheme } from './contexts/ThemeContext';

// Importando o Chart de forma dinâmica
const StockChart = dynamic(
  () => import('./components/StockChart'),
  { ssr: false }
);

interface StockData {
  papel: string;
  cotacao: string;
  pl: string;
  pvp: string;
  psr: string;
  divYield: string;
  pAtivo: string;
  pCapGiro: string;
  pEbit: string;
  pAtivCircLiq: string;
  evEbit: string;
  evEbitda: string;
  margEbit: string;
  margLiq: string;
  liqCorr: string;
  roic: string;
  roe: string;
  liq2m: string;
  patriLiq: string;
  divBruta: string;
  crescRec: string;
  score?: number;
}

interface Portfolio {
  stock: string;
  percentage: number;
}

// Função para determinar a cor do valor baseado nos critérios
const getValueColor = (indicator: string, value: number): string => {
  const criteria: { [key: string]: number[] } = {
    pl: [0, 15, 25],
    pvp: [0, 1, 3],
    roe: [15, 10, 0],
    divYield: [6, 4, 0],
    divBruta: [0, 1, 2],
    crescRec: [20, 10, 0],
    margLiq: [20, 10, 0],
    roic: [15, 10, 0],
    liqCorr: [2, 1, 0],
  };

  if (!criteria[indicator]) return 'text-white';

  const [green, yellow, red] = criteria[indicator];
  
  // Indicadores onde maior é melhor
  if (['roe', 'divYield', 'crescRec', 'margLiq', 'roic', 'liqCorr'].includes(indicator)) {
    if (value >= green) return 'text-green-400 font-bold';
    if (value >= yellow) return 'text-yellow-400 font-bold';
    return 'text-red-400 font-bold';
  }
  // Indicadores onde menor é melhor
  else {
    if (value <= green) return 'text-green-400 font-bold';
    if (value <= yellow) return 'text-yellow-400 font-bold';
    return 'text-red-400 font-bold';
  }
};

const calculateScore = (stock: StockData): number => {
  let score = 0;
  
  try {
    const pl = parseFloat(stock.pl.replace(',', '.'));
    const pvp = parseFloat(stock.pvp.replace(',', '.'));
    const roe = parseFloat(stock.roe.replace(',', '.'));
    const divYield = parseFloat(stock.divYield.replace(',', '.'));
    const divBruta = parseFloat(stock.divBruta.replace(',', '.'));
    const crescRec = parseFloat(stock.crescRec.replace(',', '.'));
    const margLiq = parseFloat(stock.margLiq.replace(',', '.'));
    const roic = parseFloat(stock.roic.replace(',', '.'));
    const liqCorr = parseFloat(stock.liqCorr.replace(',', '.'));
    const liq2m = parseFloat(stock.liq2m.replace(/\./g, '').replace(',', '.'));

    // Pontuação baseada nos critérios
    if (pl <= 15) score += 10;
    if (pvp <= 1) score += 10;
    if (roe >= 15) score += 10;
    if (divYield >= 6) score += 10;
    if (divBruta <= 1) score += 10;
    if (crescRec >= 10 && crescRec <= 20) score += 10;
    if (margLiq >= 10 && margLiq <= 20) score += 10;
    if (roic >= 15) score += 10;
    if (liqCorr >= 2) score += 10;
    if (liq2m >= 1000000) score += 10;

    // Pontuação parcial para valores próximos do ideal
    if (pl > 15 && pl <= 25) score += 5;
    if (pvp > 1 && pvp <= 3) score += 5;
    if (roe >= 10 && roe < 15) score += 5;
    if (divYield >= 4 && divYield < 6) score += 5;
    if (divBruta > 1 && divBruta <= 2) score += 5;
    if (roic >= 10 && roic < 15) score += 5;
    if (liqCorr >= 1 && liqCorr < 2) score += 5;

  } catch (error) {
    return 0;
  }

  return score;
};

export default function Home() {
  const [stocksData, setStocksData] = useState<StockData[]>([]);
  const [topStocks, setTopStocks] = useState<StockData[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedStock, setSelectedStock] = useState<any>(null);
  const [mounted, setMounted] = useState(false);
  const router = useRouter();
  const { theme, toggleTheme } = useTheme();
  
  // Carteira fictícia
  const portfolio: Portfolio[] = [
    { stock: "PETR4", percentage: 25.5 },
    { stock: "TAUR4", percentage: 47.8 },
    { stock: "META34", percentage: 12.4 },
  ];

  useEffect(() => {
    setMounted(true);
    
    // Verificar autenticação
    const isAuthenticated = typeof window !== 'undefined' && localStorage.getItem('isAuthenticated');
    if (!isAuthenticated) {
      router.push('/login');
      return;
    }

    const loadData = async () => {
      try {
        // Tentar carregar do cache primeiro
        const cachedData = localStorage.getItem('stocksData');
        const lastUpdate = localStorage.getItem('lastStockUpdate');
        const now = new Date();

        // Se tiver dados em cache e a última atualização foi hoje
        if (cachedData && lastUpdate) {
          const lastUpdateDate = new Date(lastUpdate);
          if (lastUpdateDate.toDateString() === now.toDateString()) {
            console.log('Usando dados do cache');
            const parsedData = JSON.parse(cachedData);
            setStocksData(parsedData);
            setTopStocks(parsedData.slice(0, 5));
            setLoading(false);
            return;
          }
        }

        // Se não tiver cache ou for de outro dia, buscar da API
        console.log('Buscando dados novos da API');
        const response = await axios.get('/api/stocks');
        
        if (response.data && Array.isArray(response.data)) {
          const scoredStocks = response.data
            .map((stock: StockData) => ({
              ...stock,
              score: calculateScore(stock)
            }))
            .sort((a, b) => b.score - a.score);

          // Salvar no cache
          localStorage.setItem('stocksData', JSON.stringify(scoredStocks));
          localStorage.setItem('lastStockUpdate', now.toISOString());

          setStocksData(scoredStocks);
          setTopStocks(scoredStocks.slice(0, 5));
        }
      } catch (err) {
        console.error('Erro:', err);
        // Se der erro, tentar usar cache como fallback
        const cachedData = localStorage.getItem('stocksData');
        if (cachedData) {
          const parsedData = JSON.parse(cachedData);
          setStocksData(parsedData);
          setTopStocks(parsedData.slice(0, 5));
        } else {
          setError('Erro ao carregar dados');
        }
      } finally {
        setLoading(false);
      }
    };

    if (mounted) {
      loadData();
    }
  }, [router, mounted]);

  // Função para fazer logout
  const handleLogout = () => {
    localStorage.removeItem('isAuthenticated');
    router.push('/login');
  };

  if (!mounted) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-gray-900"></div>
      </div>
    );
  }

  if (loading) return (
    <div className="flex justify-center items-center min-h-screen">
      <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-gray-900"></div>
    </div>
  );
  
  if (error) return (
    <div className="flex justify-center items-center min-h-screen">
      <div className="text-red-500 text-xl">{error}</div>
    </div>
  );

  return (
    <div className={`min-h-screen p-4 ${theme === 'light' ? 'bg-gray-100' : 'bg-gray-800'}`}>
      <div className="flex justify-between items-center mb-8">
        <h1 className={`text-3xl font-bold ${theme === 'light' ? 'text-gray-800' : 'text-white'}`}>
          Melhores Investimentos
        </h1>
        <div className="flex items-center gap-4">
          <button
            onClick={toggleTheme}
            className={`p-2 rounded-lg ${
              theme === 'light' 
                ? 'bg-gray-200 hover:bg-gray-300' 
                : 'bg-gray-700 hover:bg-gray-600'
            }`}
          >
            {theme === 'light' ? (
              <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-gray-800" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z" />
              </svg>
            ) : (
              <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-yellow-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z" />
              </svg>
            )}
          </button>
          <button
            onClick={handleLogout}
            className="bg-red-500 text-white px-4 py-2 rounded hover:bg-red-600 transition-colors"
          >
            Sair
          </button>
        </div>
      </div>
      
      {/* Grid principal */}
      <div className="grid grid-cols-3 gap-4">
        {/* Coluna da esquerda (1/3 da largura) */}
        <div className="space-y-4">
          {/* Top 5 Ações */}
          <div className={`p-4 rounded-lg shadow-lg ${theme === 'light' ? 'bg-white' : 'bg-gray-700'}`}>
            <h2 className="text-xl font-semibold mb-4 text-white">Top 5 Ações</h2>
            <ul className="space-y-2">
              {topStocks.map((stock, index) => (
                <li 
                  key={index} 
                  className="flex justify-between items-center p-2 bg-gray-600 rounded cursor-pointer hover:bg-gray-500 transition-colors"
                  onClick={() => setSelectedStock(stock)}
                >
                  <span className="font-bold text-white">
                    {index + 1}. {stock.papel}
                  </span>
                  <div className="flex flex-col items-end">
                    <span className="text-green-400">R$ {stock.cotacao}</span>
                    <span className="text-sm text-gray-300">Score: {stock.score}</span>
                  </div>
                </li>
              ))}
            </ul>
          </div>

          {/* Minha Carteira */}
          <div className={`p-4 rounded-lg shadow-lg ${theme === 'light' ? 'bg-white' : 'bg-gray-700'}`}>
            <h2 className="text-xl font-semibold mb-4 text-white">Minha Carteira</h2>
            <div className="space-y-4">
              {portfolio.map((item, index) => (
                <div key={index} className="flex justify-between items-center p-2 bg-gray-600 rounded">
                  <span className="font-medium text-white">{item.stock}</span>
                  <span className="text-green-400">{item.percentage}%</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Coluna da direita (2/3 da largura) */}
        <div className="col-span-2">
          {/* Gráfico de Desempenho com altura fixa */}
          <div className={`p-4 rounded-lg shadow-lg ${theme === 'light' ? 'bg-white' : 'bg-gray-700'}`}>
            <h2 className="text-xl font-semibold mb-4 text-white">Gráfico de Desempenho</h2>
            <div className="w-full h-[600px]"> {/* Altura fixa de 600px */}
              <StockChart topStocks={topStocks} />
            </div>
          </div>
        </div>
      </div>

      {/* Dados Fundamentalistas (largura total) */}
      <div className={`mt-4 p-4 rounded-lg shadow-lg ${theme === 'light' ? 'bg-white' : 'bg-gray-700'} overflow-x-auto`}>
        <h2 className="text-xl font-semibold mb-4 text-white">Dados Fundamentalistas</h2>
        <table className="min-w-full">
          <thead>
            <tr className="bg-gray-600">
              <th className="px-4 py-2 text-white">Papel</th>
              <th className="px-4 py-2 text-white">Cotação</th>
              <th className="px-4 py-2 text-white">P/L</th>
              <th className="px-4 py-2 text-white">P/VP</th>
              <th className="px-4 py-2 text-white">ROE</th>
              <th className="px-4 py-2 text-white">Div.Yield</th>
              <th className="px-4 py-2 text-white">Dív.Bruta/PL</th>
              <th className="px-4 py-2 text-white">Cresc.Rec.5a</th>
              <th className="px-4 py-2 text-white">Marg.Líquida</th>
              <th className="px-4 py-2 text-white">ROIC</th>
              <th className="px-4 py-2 text-white">Liq.Corrente</th>
            </tr>
          </thead>
          <tbody>
            {stocksData.map((stock, index) => (
              <tr key={index} className="border-t border-gray-600 hover:bg-gray-600">
                <td className="px-4 py-2 font-medium text-white">{stock.papel}</td>
                <td className="px-4 py-2 text-white">R$ {stock.cotacao}</td>
                <td className={`px-4 py-2 ${getValueColor('pl', parseFloat(stock.pl.replace(',', '.')))}}`}>
                  {stock.pl}
                </td>
                <td className={`px-4 py-2 ${getValueColor('pvp', parseFloat(stock.pvp.replace(',', '.')))}}`}>
                  {stock.pvp}
                </td>
                <td className={`px-4 py-2 ${getValueColor('roe', parseFloat(stock.roe.replace(',', '.')))}}`}>
                  {stock.roe}%
                </td>
                <td className={`px-4 py-2 ${getValueColor('divYield', parseFloat(stock.divYield.replace(',', '.')))}}`}>
                  {stock.divYield}%
                </td>
                <td className={`px-4 py-2 ${getValueColor('divBruta', parseFloat(stock.divBruta.replace(',', '.')))}}`}>
                  {stock.divBruta}
                </td>
                <td className={`px-4 py-2 ${getValueColor('crescRec', parseFloat(stock.crescRec.replace(',', '.')))}}`}>
                  {stock.crescRec}%
                </td>
                <td className={`px-4 py-2 ${getValueColor('margLiq', parseFloat(stock.margLiq.replace(',', '.')))}}`}>
                  {stock.margLiq}%
                </td>
                <td className={`px-4 py-2 ${getValueColor('roic', parseFloat(stock.roic.replace(',', '.')))}}`}>
                  {stock.roic}%
                </td>
                <td className={`px-4 py-2 ${getValueColor('liqCorr', parseFloat(stock.liqCorr.replace(',', '.')))}}`}>
                  {stock.liqCorr}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {selectedStock && (
        <StockDetailModal 
          stock={selectedStock} 
          onClose={() => setSelectedStock(null)} 
        />
      )}
    </div>
  );
} 
