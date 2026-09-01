import React from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Compass, ArrowLeft, Home } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import logoImg from '../../assets/logo_pmrg.png';

export const NotFoundPage = () => {
  const { user } = useAuth();
  const navigate = useNavigate();

  return (
    <div
      className="min-h-screen flex items-center justify-center p-4 sm:p-6 bg-[#F5F8FF]"
      style={{ backgroundImage: 'radial-gradient(#CBD5E1 1px, transparent 1px)', backgroundSize: '24px 24px' }}
    >
      <div className="max-w-md w-full bg-white border border-[#E2E8F0] rounded-2xl p-6 sm:p-8 card-shadow text-center space-y-6 animate-in fade-in zoom-in-95 duration-150">
        
        <div className="flex justify-center">
          <Link to="/" className="inline-block">
            <img src={logoImg} alt="SentinelOS" className="h-9 w-auto max-w-[150px] object-contain" />
          </Link>
        </div>

        <div className="w-14 h-14 rounded-2xl bg-blue-50 border border-blue-200 text-[#2463EB] flex items-center justify-center mx-auto">
          <Compass className="w-7 h-7" />
        </div>

        <div className="space-y-2">
          <span className="text-[11px] font-bold uppercase tracking-wider bg-blue-50 text-[#2463EB] px-2.5 py-0.5 rounded-full font-mono border border-blue-200">
            404 &bull; Page Not Found
          </span>
          <h1 className="text-xl font-bold text-gray-900 tracking-tight">
            Route Does Not Exist
          </h1>
          <p className="text-xs text-gray-500 leading-relaxed">
            The page you are looking for has been moved, removed, or never existed in the SentinelOS governance architecture.
          </p>
        </div>

        <div className="flex items-center gap-3 pt-2">
          <button
            onClick={() => navigate(-1)}
            className="flex-1 py-2.5 rounded-xl border border-gray-200 text-gray-700 hover:bg-gray-50 text-xs font-semibold transition-colors flex items-center justify-center gap-1.5 cursor-pointer"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>Go Back</span>
          </button>
          
          <button
            onClick={() => navigate(user ? '/cockpit' : '/')}
            className="flex-1 py-2.5 rounded-xl bg-[#2463EB] hover:bg-[#1D4ED8] text-white text-xs font-bold shadow-md shadow-blue-500/20 transition-colors flex items-center justify-center gap-1.5 cursor-pointer"
          >
            <Home className="w-3.5 h-3.5" />
            <span>{user ? 'Go to Dashboard' : 'Return Home'}</span>
          </button>
        </div>

      </div>
    </div>
  );
};
