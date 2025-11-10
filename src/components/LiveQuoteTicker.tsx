'use client';

import React, { useEffect, useState } from 'react';
import { api } from '@/lib/api';
import { TrendingUp, TrendingDown } from 'lucide-react';

interface Quote {
  symbol: string;
  price: number;
  change: number;
  changePercent: number;
}

// Popular UK stocks to display
const UK_STOCKS = ['VOD.L', 'BP.L', 'BT.L', 'LLOY.L', 'BARC.L', 'TSCO.L', 'RIO.L', 'GSK.L'];

export default function LiveQuoteTicker() {
  const [quotes, setQuotes] = useState<Record<string, Quote>>({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchQuotes();
    // Refresh quotes every 30 seconds
    const interval = setInterval(fetchQuotes, 30000);
    return () => clearInterval(interval);
  }, []);

  const fetchQuotes = async () => {
    try {
      setLoading(false); // Only show loading on first load
      const response = await api.quotes.getQuotes(UK_STOCKS);
      // API returns an object, not a Map
      setQuotes(response.data.data || {});
    } catch (error) {
      console.error('Failed to fetch quotes:', error);
    }
  };

  // Convert object to array
  const quoteArray = Object.values(quotes);

  if (quoteArray.length === 0 && loading) {
    return (
      <div className="bg-primary text-white py-2 px-4">
        <div className="flex items-center justify-center">
          <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
          <span className="text-sm">Loading market data...</span>
        </div>
      </div>
    );
  }

  if (quoteArray.length === 0) {
    return null;
  }

  return (
    <div className="bg-primary text-white py-2 overflow-hidden">
      <div className="flex items-center space-x-8 animate-scroll">
        {quoteArray.map((quote) => (
          <div
            key={quote.symbol}
            className="flex items-center space-x-2 whitespace-nowrap"
          >
            <span className="font-semibold">{quote.symbol}</span>
            <span className="text-sm">£{quote.price.toFixed(2)}</span>
            <div className={`flex items-center space-x-1 ${quote.change >= 0 ? 'text-green-300' : 'text-red-300'}`}>
              {quote.change >= 0 ? (
                <TrendingUp className="h-3 w-3" />
              ) : (
                <TrendingDown className="h-3 w-3" />
              )}
              <span className="text-xs">
                {quote.change >= 0 ? '+' : ''}{quote.change.toFixed(2)} ({quote.changePercent >= 0 ? '+' : ''}{quote.changePercent.toFixed(2)}%)
              </span>
            </div>
          </div>
        ))}
        {/* Duplicate for seamless loop */}
        {quoteArray.map((quote) => (
          <div
            key={`${quote.symbol}-dup`}
            className="flex items-center space-x-2 whitespace-nowrap"
          >
            <span className="font-semibold">{quote.symbol}</span>
            <span className="text-sm">£{quote.price.toFixed(2)}</span>
            <div className={`flex items-center space-x-1 ${quote.change >= 0 ? 'text-green-300' : 'text-red-300'}`}>
              {quote.change >= 0 ? (
                <TrendingUp className="h-3 w-3" />
              ) : (
                <TrendingDown className="h-3 w-3" />
              )}
              <span className="text-xs">
                {quote.change >= 0 ? '+' : ''}{quote.change.toFixed(2)} ({quote.changePercent >= 0 ? '+' : ''}{quote.changePercent.toFixed(2)}%)
              </span>
            </div>
          </div>
        ))}
      </div>
      <style jsx>{`
        @keyframes scroll {
          0% {
            transform: translateX(0);
          }
          100% {
            transform: translateX(-50%);
          }
        }
        .animate-scroll {
          animation: scroll 30s linear infinite;
        }
      `}</style>
    </div>
  );
}

