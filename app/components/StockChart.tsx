'use client';

import { useEffect, useRef, useState } from 'react';
import Chart from 'chart.js/auto';
import axios from 'axios';

interface StockChartProps {
  topStocks: Array<{
    papel: string;
    cotacao: string;
  }>;
}

interface HistoricalData {
  date: string;
  price: number;
}

const StockChart = ({ topStocks }: StockChartProps) => {
  const chartRef = useRef<HTMLCanvasElement>(null);
  const chartInstance = useRef<Chart | null>(null);
  const [mounted, setMounted] = useState(false);
  const [loading, setLoading] = useState(true);
  const [historicalDataMap, setHistoricalDataMap] = useState<Map<string, HistoricalData[]>>(new Map());

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    const fetchHistoricalData = async () => {
      try {
        setLoading(true);
        const dataMap = new Map();
        
        // Buscar dados históricos para cada ação do top 5
        await Promise.all(
          topStocks.map(async (stock) => {
            const response = await axios.get(`/api/stockHistory?symbol=${stock.papel}`);
            dataMap.set(stock.papel, response.data);
          })
        );

        setHistoricalDataMap(dataMap);
      } catch (error) {
        console.error('Erro ao buscar dados históricos:', error);
      } finally {
        setLoading(false);
      }
    };

    if (mounted && topStocks.length > 0) {
      fetchHistoricalData();
    }
  }, [topStocks, mounted]);

  useEffect(() => {
    if (!mounted || loading || historicalDataMap.size === 0) return;

    if (chartRef.current) {
      if (chartInstance.current) {
        chartInstance.current.destroy();
      }

      const ctx = chartRef.current.getContext('2d');
      if (ctx) {
        const colors = [
          'rgb(34, 197, 94)',
          'rgb(59, 130, 246)',
          'rgb(239, 68, 68)',
          'rgb(168, 85, 247)',
          'rgb(251, 146, 60)'
        ];

        const datasets = topStocks.map((stock, index) => {
          const historicalData = historicalDataMap.get(stock.papel) || [];
          
          return {
            label: stock.papel,
            data: historicalData.map(data => data.price),
            borderColor: colors[index],
            backgroundColor: colors[index].replace('rgb', 'rgba').replace(')', ', 0.2)'),
            tension: 0.1
          };
        });

        const dates = historicalDataMap.get(topStocks[0]?.papel)?.map(data => data.date) || [];

        chartInstance.current = new Chart(ctx, {
          type: 'line',
          data: {
            labels: dates,
            datasets: datasets
          },
          options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
              legend: {
                position: 'top' as const,
                labels: {
                  color: 'white',
                  padding: 20,
                  font: {
                    size: 12
                  }
                }
              },
              title: {
                display: true,
                text: 'Desempenho das Top 5 Ações (12 meses)',
                color: 'white',
                font: {
                  size: 16
                }
              }
            },
            scales: {
              y: {
                beginAtZero: false,
                ticks: {
                  color: 'white',
                  callback: function(value) {
                    return 'R$ ' + value.toFixed(2);
                  }
                },
                grid: {
                  color: 'rgba(255, 255, 255, 0.1)'
                }
              },
              x: {
                ticks: {
                  color: 'white'
                },
                grid: {
                  color: 'rgba(255, 255, 255, 0.1)'
                }
              }
            }
          }
        });
      }
    }

    return () => {
      if (chartInstance.current) {
        chartInstance.current.destroy();
      }
    };
  }, [topStocks, mounted, historicalDataMap, loading]);

  if (!mounted) return null;

  return (
    <div className="w-full h-full">
      {loading ? (
        <div className="flex items-center justify-center h-64">
          <span className="text-white">Carregando dados históricos...</span>
        </div>
      ) : (
        <canvas ref={chartRef} />
      )}
    </div>
  );
};

export default StockChart;