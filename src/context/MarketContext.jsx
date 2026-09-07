import React, { createContext, useContext, useState, useEffect } from 'react';
import { api } from '../services/api';

const MarketContext = createContext(null);

export const MARKET_CONFIGS = {
  mumbai: {
    id: 'mumbai',
    name: 'Mumbai',
    city: 'Mumbai',
    label: 'Market: Mumbai',
    accentColor: '#2563EB',
    defaultNode: 'OLT-BND-01',
    description: 'Mumbai Metropolitan Region Optical & FTTH Network',
    localities: [
      'Bandra West', 'Andheri East', 'BKC', 'Powai',
      'Lower Parel', 'Dadar', 'Malad West', 'Thane West',
      'Juhu', 'Worli', 'Borivali', 'Ghatkopar'
    ]
  },
  kolkata: {
    id: 'kolkata',
    name: 'Kolkata',
    city: 'Kolkata',
    label: 'Market: Kolkata',
    accentColor: '#0D9488',
    defaultNode: 'OLT-SLK-01',
    description: 'Kolkata Metropolitan & IT Corridor Optical Network',
    localities: [
      'Salt Lake Sector V', 'Park Street', 'New Town', 'Ballygunge',
      'Howrah', 'Jadavpur', 'Behala', 'Dum Dum',
      'Alipore', 'Gariahat', 'Rajarhat', 'Shyambazar'
    ]
  }
};

export const MarketProvider = ({ children }) => {
  const [currentMarket, setCurrentMarket] = useState(() => {
    const saved = localStorage.getItem('pmrg_market');
    return (saved && MARKET_CONFIGS[saved]) ? saved : 'mumbai';
  });

  const marketConfig = MARKET_CONFIGS[currentMarket] || MARKET_CONFIGS.mumbai;
  const availableMarkets = Object.values(MARKET_CONFIGS);

  const switchMarket = (marketId) => {
    if (!MARKET_CONFIGS[marketId]) return;
    localStorage.setItem('pmrg_market', marketId);
    setCurrentMarket(marketId);
    api.clearCache();
    window.dispatchEvent(new CustomEvent('market-change', { detail: { marketId } }));
  };

  useEffect(() => {
    localStorage.setItem('pmrg_market', currentMarket);
  }, [currentMarket]);

  return (
    <MarketContext.Provider value={{ 
      currentMarket, 
      marketConfig, 
      switchMarket, 
      markets: availableMarkets, 
      availableMarkets 
    }}>
      {children}
    </MarketContext.Provider>
  );
};

export const useMarket = () => {
  const ctx = useContext(MarketContext);
  if (!ctx) {
    throw new Error('useMarket must be used within a MarketProvider');
  }
  return ctx;
};
