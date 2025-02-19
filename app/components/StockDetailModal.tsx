'use client';

import { useEffect, useRef, useState } from 'react';
import Chart from 'chart.js/auto';
import { CandlestickController, CandlestickElement, OhlcElement } from 'chartjs-chart-financial';
import axios from 'axios';

// Registrar os elementos necessários
Chart.register(CandlestickController, CandlestickElement, OhlcElement);

interface StockDetailModalProps {
  stock: any;
  onClose: () => void;
}

interface HistoricalData {
  date: string;
  price: number;
}

interface StructuredAnalysis {
  overview: string;
  positivePoints: string[];
  negativePoints: string[];
  keyMetrics: {
    category: string;
    metrics: Array<{
      name: string;
      value: string;
      evaluation: string;
    }>;
  }[];
  recommendation: {
    verdict: string;
    reasoning: string[];
  };
}

const ANALYSIS_STEPS = [
  'Analisando saúde financeira...',
  'Avaliando múltiplos...',
  'Calculando rentabilidade...',
  'Verificando dividendos...',
  'Analisando endividamento...',
  'Identificando pontos fortes e fracos...',
  'Avaliando riscos e oportunidades...',
  'Elaborando recomendação final...'
];

const StockDetailModal = ({ stock, onClose }: StockDetailModalProps) => {
  const [mounted, setMounted] = useState(false);
  const [historicalData, setHistoricalData] = useState<HistoricalData[]>([]);
  const [loading, setLoading] = useState(true);
  const lineChartRef = useRef<HTMLCanvasElement>(null);
  const indicatorsChartRef = useRef<HTMLCanvasElement>(null);
  const chartInstances = useRef<Chart[]>([]);
  const [deepAnalysis, setDeepAnalysis] = useState<string>('');
  const [structuredAnalysis, setStructuredAnalysis] = useState<StructuredAnalysis | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [currentStep, setCurrentStep] = useState(0);
  const [analysisProgress, setAnalysisProgress] = useState<string[]>([]);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    const fetchHistoricalData = async () => {
      try {
        setLoading(true);
        const response = await axios.get(`/api/stockHistory?symbol=${stock.papel}`);
        setHistoricalData(response.data);
      } catch (error) {
        console.error('Erro ao buscar dados históricos:', error);
      } finally {
        setLoading(false);
      }
    };

    if (mounted && stock.papel) {
      fetchHistoricalData();
    }
  }, [stock.papel, mounted]);

  useEffect(() => {
    if (!mounted || loading || !historicalData.length) return;

    chartInstances.current.forEach(chart => chart.destroy());
    chartInstances.current = [];

    if (lineChartRef.current && indicatorsChartRef.current) {
      // Gráfico de Linha com dados reais
      const lineChart = new Chart(lineChartRef.current, {
        type: 'line',
        data: {
          labels: historicalData.map(data => data.date),
          datasets: [{
            label: stock.papel,
            data: historicalData.map(data => data.price),
            borderColor: 'rgb(34, 197, 94)',
            backgroundColor: 'rgba(34, 197, 94, 0.1)',
            tension: 0.1,
            fill: true
          }]
        },
        options: {
          responsive: true,
          plugins: {
            legend: {
              labels: {
                color: 'white'
              }
            },
            title: {
              display: true,
              text: 'Evolução do Preço (12 meses)',
              color: 'white'
            }
          },
          scales: {
            y: {
              ticks: { 
                color: 'white',
                callback: (value) => `R$ ${value.toFixed(2)}`
              },
              grid: { color: 'rgba(255, 255, 255, 0.1)' }
            },
            x: {
              ticks: { color: 'white' },
              grid: { color: 'rgba(255, 255, 255, 0.1)' }
            }
          }
        }
      });

      // Gráfico de Indicadores (mantido como estava)
      const indicatorsChart = new Chart(indicatorsChartRef.current, {
        type: 'bar',
        data: {
          labels: ['ROE', 'Div.Yield', 'P/L', 'Marg.Líq', 'ROIC'],
          datasets: [{
            label: 'Valores',
            data: [
              parseFloat(stock.roe),
              parseFloat(stock.divYield),
              parseFloat(stock.pl),
              parseFloat(stock.margLiq),
              parseFloat(stock.roic)
            ],
            backgroundColor: [
              'rgba(34, 197, 94, 0.6)',
              'rgba(59, 130, 246, 0.6)',
              'rgba(239, 68, 68, 0.6)',
              'rgba(168, 85, 247, 0.6)',
              'rgba(251, 146, 60, 0.6)'
            ]
          }]
        },
        options: {
          responsive: true,
          plugins: {
            legend: {
              labels: {
                color: 'white'
              }
            }
          },
          scales: {
            y: {
              ticks: { color: 'white' },
              grid: { color: 'rgba(255, 255, 255, 0.1)' }
            },
            x: {
              ticks: { color: 'white' },
              grid: { color: 'rgba(255, 255, 255, 0.1)' }
            }
          }
        }
      });

      chartInstances.current = [lineChart, indicatorsChart];
    }
  }, [stock, mounted, historicalData, loading]);

  const handleDeepAnalysis = async () => {
    try {
      setIsAnalyzing(true);
      setDeepAnalysis('');
      setAnalysisProgress([]);
      setCurrentStep(0);

      // Simular progresso da análise
      for (let i = 0; i < ANALYSIS_STEPS.length; i++) {
        setCurrentStep(i);
        setAnalysisProgress(prev => [...prev, ANALYSIS_STEPS[i]]);
        await new Promise(resolve => setTimeout(resolve, 1000));
      }

      const response = await axios.post('/api/deepAnalysis', { stock });
      
      if (response.data.analysis) {
        // Extrair o texto da resposta corretamente
        let analysisText = '';
        if (typeof response.data.analysis === 'string') {
          analysisText = response.data.analysis;
        } else if (response.data.analysis.text) {
          analysisText = response.data.analysis.text;
        } else if (Array.isArray(response.data.analysis)) {
          analysisText = response.data.analysis.map(item => item.text).join('\n');
        }

        setDeepAnalysis(analysisText);

        // Após a primeira análise, fazer a análise estruturada
        setAnalysisProgress(prev => [...prev, 'Estruturando análise...']);
        const structuredResponse = await axios.post('/api/structureAnalysis', { 
          rawAnalysis: analysisText,
          stock: stock.papel 
        });
        
        if (structuredResponse.data) {
          setStructuredAnalysis(structuredResponse.data);
        }
      }
    } catch (error) {
      console.error('Erro na análise:', error);
      setAnalysisProgress(prev => [...prev, 'Erro na análise. Por favor, tente novamente.']);
    } finally {
      setIsAnalyzing(false);
      setCurrentStep(-1);
    }
  };

  if (!mounted) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex justify-center items-center">
      <div className="bg-gray-800 p-6 rounded-lg w-11/12 max-w-6xl max-h-[90vh] overflow-y-auto">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-2xl font-bold text-white">{stock.papel}</h2>
          <button 
            onClick={onClose}
            className="text-white hover:text-gray-300"
          >
            ✕
          </button>
        </div>

        <div className="grid grid-cols-2 gap-4 mb-4">
          <div className="bg-gray-700 p-4 rounded-lg">
            <h3 className="text-xl font-semibold text-white mb-2">Evolução do Preço</h3>
            {loading ? (
              <div className="flex items-center justify-center h-64">
                <span className="text-white">Carregando dados históricos...</span>
              </div>
            ) : (
              <canvas ref={lineChartRef} className="w-full h-64" />
            )}
          </div>
          <div className="bg-gray-700 p-4 rounded-lg">
            <h3 className="text-xl font-semibold text-white mb-2">Indicadores Principais</h3>
            <canvas ref={indicatorsChartRef} className="w-full h-64" />
          </div>
        </div>

        <div className="grid grid-cols-3 gap-4">
          <div className="bg-gray-700 p-4 rounded-lg">
            <h3 className="text-lg font-semibold text-white mb-2">Dados Fundamentalistas</h3>
            <ul className="space-y-2">
              <li className="flex justify-between">
                <span className="text-gray-300">P/L</span>
                <span className="text-white">{stock.pl}</span>
              </li>
              <li className="flex justify-between">
                <span className="text-gray-300">P/VP</span>
                <span className="text-white">{stock.pvp}</span>
              </li>
              <li className="flex justify-between">
                <span className="text-gray-300">ROE</span>
                <span className="text-white">{stock.roe}%</span>
              </li>
            </ul>
          </div>
          <div className="bg-gray-700 p-4 rounded-lg">
            <h3 className="text-lg font-semibold text-white mb-2">Dividendos</h3>
            <ul className="space-y-2">
              <li className="flex justify-between">
                <span className="text-gray-300">Div.Yield</span>
                <span className="text-white">{stock.divYield}%</span>
              </li>
              <li className="flex justify-between">
                <span className="text-gray-300">Payout</span>
                <span className="text-white">{stock.payout}%</span>
              </li>
            </ul>
          </div>
          <div className="bg-gray-700 p-4 rounded-lg">
            <h3 className="text-lg font-semibold text-white mb-2">Eficiência</h3>
            <ul className="space-y-2">
              <li className="flex justify-between">
                <span className="text-gray-300">Marg. Líquida</span>
                <span className="text-white">{stock.margLiq}%</span>
              </li>
              <li className="flex justify-between">
                <span className="text-gray-300">ROIC</span>
                <span className="text-white">{stock.roic}%</span>
              </li>
            </ul>
          </div>
        </div>

        {/* Seção de Análise Profunda */}
        <div className="mt-6">
          <button
            onClick={handleDeepAnalysis}
            disabled={isAnalyzing}
            className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded transition-colors duration-200 disabled:opacity-50"
          >
            {isAnalyzing ? 'Analisando...' : 'Busca Profunda'}
          </button>

          {/* Progresso da Análise */}
          {isAnalyzing && (
            <div className="mt-4 bg-gray-700 p-4 rounded-lg">
              <h3 className="text-xl font-semibold text-white mb-4">
                Progresso da Análise
              </h3>
              <div className="space-y-2">
                {analysisProgress.map((step, index) => (
                  <div 
                    key={index} 
                    className="flex items-center text-white"
                  >
                    <div className="w-6 h-6 mr-3 flex items-center justify-center">
                      {index === currentStep ? (
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white" />
                      ) : (
                        <span className="text-green-400">✓</span>
                      )}
                    </div>
                    <span className={index === currentStep ? 'text-blue-400' : 'text-white'}>
                      {step}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Resultado da Análise */}
          {deepAnalysis && (
            <div className="mt-4 bg-gray-700 p-4 rounded-lg">
              <h3 className="text-xl font-semibold text-white mb-4">Análise Inicial</h3>
              <div className="text-white whitespace-pre-line">
                {typeof deepAnalysis === 'string' ? deepAnalysis : ''}
              </div>
            </div>
          )}
        </div>

        {/* Análise Estruturada */}
        {structuredAnalysis && (
          <div className="mt-6 space-y-6">
            <div className="bg-gray-700 p-4 rounded-lg">
              <h3 className="text-xl font-semibold text-white mb-4">Visão Geral</h3>
              <p className="text-white">
                {typeof structuredAnalysis.overview === 'string' ? structuredAnalysis.overview : ''}
              </p>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="bg-gray-700 p-4 rounded-lg">
                <h3 className="text-xl font-semibold text-green-400 mb-4">Pontos Positivos</h3>
                <ul className="list-disc list-inside text-white space-y-2">
                  {Array.isArray(structuredAnalysis.positivePoints) && 
                    structuredAnalysis.positivePoints.map((point, index) => (
                      <li key={index}>{typeof point === 'string' ? point : ''}</li>
                    ))}
                </ul>
              </div>

              <div className="bg-gray-700 p-4 rounded-lg">
                <h3 className="text-xl font-semibold text-red-400 mb-4">Pontos de Atenção</h3>
                <ul className="list-disc list-inside text-white space-y-2">
                  {Array.isArray(structuredAnalysis.negativePoints) && 
                    structuredAnalysis.negativePoints.map((point, index) => (
                      <li key={index}>{typeof point === 'string' ? point : ''}</li>
                    ))}
                </ul>
              </div>
            </div>

            <div className="bg-gray-700 p-4 rounded-lg">
              <h3 className="text-xl font-semibold text-white mb-4">Métricas Chave</h3>
              <div className="space-y-4">
                {structuredAnalysis.keyMetrics.map((category, index) => (
                  <div key={index}>
                    <h4 className="text-lg font-medium text-blue-400 mb-2">{category.category}</h4>
                    <div className="grid grid-cols-3 gap-4">
                      {category.metrics.map((metric, idx) => (
                        <div key={idx} className="bg-gray-600 p-3 rounded">
                          <div className="text-sm text-gray-300">{metric.name}</div>
                          <div className="text-lg font-bold text-white">{metric.value}</div>
                          <div className={`text-sm ${
                            metric.evaluation.includes('Positivo') ? 'text-green-400' : 
                            metric.evaluation.includes('Negativo') ? 'text-red-400' : 
                            'text-yellow-400'
                          }`}>{metric.evaluation}</div>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="bg-gray-700 p-4 rounded-lg">
              <h3 className="text-xl font-semibold text-white mb-4">Recomendação Final</h3>
              <div className={`text-2xl font-bold mb-4 ${
                structuredAnalysis.recommendation.verdict.includes('COMPRA') ? 'text-green-400' :
                structuredAnalysis.recommendation.verdict.includes('VENDA') ? 'text-red-400' :
                'text-yellow-400'
              }`}>
                {structuredAnalysis.recommendation.verdict}
              </div>
              <ul className="list-disc list-inside text-white space-y-2">
                {structuredAnalysis.recommendation.reasoning.map((reason, index) => (
                  <li key={index}>{reason}</li>
                ))}
              </ul>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default StockDetailModal; 