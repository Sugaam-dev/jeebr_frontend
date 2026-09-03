import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { ChevronRight, ArrowLeft, Home } from 'lucide-react';

/**
 * Reusable Breadcrumbs component for smooth navigation between views.
 * @param {Array} items - [{ label: string, to?: string, icon?: React.Component }]
 * @param {string} [backTo] - Optional path for back button
 * @param {string} [backLabel] - Optional label for back button
 */
export default function Breadcrumbs({ items = [], backTo, backLabel = 'Back' }) {
  const navigate = useNavigate();

  return (
    <nav className="flex items-center justify-between py-2 px-3.5 bg-white border border-[#E2E8F0] rounded-xl mb-4 text-xs card-shadow">
      <div className="flex items-center space-x-2 overflow-x-auto scrollbar-none py-0.5">
        <Link 
          to="/cockpit" 
          className="flex items-center text-gray-400 hover:text-[#2463EB] transition-colors p-1 rounded-md hover:bg-slate-50"
          title="Executive Cockpit"
        >
          <Home className="w-3.5 h-3.5" />
        </Link>

        {items.map((item, index) => {
          const isLast = index === items.length - 1;
          const IconComponent = item.icon;

          return (
            <React.Fragment key={index}>
              <ChevronRight className="w-3.5 h-3.5 text-gray-300 flex-shrink-0" />
              {isLast || !item.to ? (
                <span className="flex items-center gap-1.5 font-bold text-gray-900 truncate">
                  {IconComponent && <IconComponent className="w-3.5 h-3.5 text-emerald-600" />}
                  {item.label}
                </span>
              ) : (
                <Link
                  to={item.to}
                  className="flex items-center gap-1.5 text-gray-500 hover:text-[#2463EB] transition-colors truncate font-medium"
                >
                  {IconComponent && <IconComponent className="w-3.5 h-3.5 text-gray-400" />}
                  {item.label}
                </Link>
              )}
            </React.Fragment>
          );
        })}
      </div>

      {(backTo || items.length > 1) && (
        <button
          onClick={() => backTo ? navigate(backTo) : navigate(-1)}
          className="flex items-center gap-1.5 text-gray-700 hover:text-gray-900 bg-slate-50 hover:bg-slate-100 border border-[#CBD5E1] px-2.5 py-1 rounded-lg transition-colors ml-3 flex-shrink-0 font-semibold cursor-pointer shadow-xs text-xs"
          title="Go to previous view"
        >
          <ArrowLeft className="w-3 h-3 text-gray-500" />
          <span>{backLabel}</span>
        </button>
      )}
    </nav>
  );
}
