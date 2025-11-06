import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { opportunitiesApi, jurisdictionsApi } from '../api/client';
import { Opportunity, Jurisdiction } from '../types';
import {
  ArrowLeft,
  Search,
  Calendar,
  DollarSign,
  MapPin,
  Building,
  AlertCircle,
  ExternalLink,
  TrendingUp
} from 'lucide-react';

const OpportunitiesPage: React.FC = () => {
  const navigate = useNavigate();
  const [opportunities, setOpportunities] = useState<Opportunity[]>([]);
  const [jurisdictions, setJurisdictions] = useState<Jurisdiction[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [filters, setFilters] = useState({
    jurisdiction: '',
    naics: '',
    min_value: '',
    max_value: '',
    is_active: true,
    days_until_due: '',
  });

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const [oppsResponse, jurisdictionsResponse] = await Promise.all([
        opportunitiesApi.getAll(0, 100, true),
        jurisdictionsApi.getAll(),
      ]);
      setOpportunities(oppsResponse.data);
      setJurisdictions(jurisdictionsResponse.data);
    } catch (err) {
      console.error('Failed to load data:', err);
      setError('Failed to load opportunities');
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = async () => {
    setLoading(true);
    setError(null);

    try {
      const response = await opportunitiesApi.simpleSearch({
        jurisdiction: filters.jurisdiction || undefined,
        naics: filters.naics || undefined,
        min_value: filters.min_value ? parseFloat(filters.min_value) : undefined,
        max_value: filters.max_value ? parseFloat(filters.max_value) : undefined,
        is_active: filters.is_active,
        days_until_due: filters.days_until_due ? parseInt(filters.days_until_due) : undefined,
      });
      setOpportunities(response.data);
    } catch (err) {
      console.error('Search failed:', err);
      setError('Search failed');
    } finally {
      setLoading(false);
    }
  };

  const handleClearFilters = () => {
    setFilters({
      jurisdiction: '',
      naics: '',
      min_value: '',
      max_value: '',
      is_active: true,
      days_until_due: '',
    });
    loadData();
  };

  const calculateDaysUntilDue = (dueDate: string | null): number | null => {
    if (!dueDate) return null;
    const today = new Date();
    const due = new Date(dueDate);
    const diffTime = due.getTime() - today.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays;
  };

  const getDueDateColor = (days: number | null): string => {
    if (days === null) return 'text-gray-600';
    if (days < 7) return 'text-red-600 font-semibold';
    if (days < 14) return 'text-yellow-600 font-semibold';
    return 'text-gray-600';
  };

  const handleViewAssessment = (opportunityId: string) => {
    navigate(`/assessment/${opportunityId}`);
  };

  if (loading && opportunities.length === 0) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="inline-block w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-7xl mx-auto px-4">
        {/* Header */}
        <button
          onClick={() => navigate('/')}
          className="flex items-center gap-2 text-gray-600 hover:text-gray-900 mb-6 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to Home
        </button>

        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            Procurement Opportunities
          </h1>
          <p className="text-gray-600">
            Search and track opportunities across Maryland and DC
          </p>
        </div>

        {error && (
          <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-md flex items-start">
            <AlertCircle className="w-5 h-5 text-red-500 mr-2 flex-shrink-0 mt-0.5" />
            <p className="text-red-700 text-sm">{error}</p>
          </div>
        )}

        {/* Search Filters */}
        <div className="bg-white rounded-lg shadow-md p-6 mb-6">
          <h3 className="text-lg font-semibold mb-4">Search Filters</h3>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Jurisdiction
              </label>
              <select
                value={filters.jurisdiction}
                onChange={(e) => setFilters({ ...filters, jurisdiction: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="">All Jurisdictions</option>
                {jurisdictions.map((j) => (
                  <option key={j.id} value={j.code}>
                    {j.name}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                NAICS Code
              </label>
              <input
                type="text"
                value={filters.naics}
                onChange={(e) => setFilters({ ...filters, naics: e.target.value })}
                placeholder="e.g., 236220"
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Min Value ($)
              </label>
              <input
                type="number"
                value={filters.min_value}
                onChange={(e) => setFilters({ ...filters, min_value: e.target.value })}
                placeholder="0"
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Max Value ($)
              </label>
              <input
                type="number"
                value={filters.max_value}
                onChange={(e) => setFilters({ ...filters, max_value: e.target.value })}
                placeholder="No limit"
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Days Until Due
              </label>
              <input
                type="number"
                value={filters.days_until_due}
                onChange={(e) => setFilters({ ...filters, days_until_due: e.target.value })}
                placeholder="Any"
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div className="flex items-end">
              <label className="flex items-center">
                <input
                  type="checkbox"
                  checked={filters.is_active}
                  onChange={(e) =>
                    setFilters({ ...filters, is_active: e.target.checked })
                  }
                  className="h-4 w-4 text-blue-600 rounded focus:ring-2 focus:ring-blue-500"
                />
                <span className="ml-2 text-sm text-gray-700">Active Only</span>
              </label>
            </div>
          </div>

          <div className="flex gap-2">
            <button
              onClick={handleSearch}
              className="px-6 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 flex items-center gap-2"
            >
              <Search className="w-4 h-4" />
              Search
            </button>
            <button
              onClick={handleClearFilters}
              className="px-6 py-2 bg-gray-300 text-gray-700 rounded-md hover:bg-gray-400"
            >
              Clear Filters
            </button>
          </div>
        </div>

        {/* Results */}
        <div className="bg-white rounded-lg shadow-md overflow-hidden">
          <div className="px-6 py-4 bg-gray-50 border-b border-gray-200">
            <h2 className="text-xl font-semibold text-gray-800">
              Opportunities ({opportunities.length})
            </h2>
          </div>

          {opportunities.length === 0 ? (
            <div className="p-12 text-center text-gray-500">
              <Building className="w-16 h-16 mx-auto mb-4 text-gray-400" />
              <p>No opportunities found matching your criteria.</p>
            </div>
          ) : (
            <div className="divide-y divide-gray-200">
              {opportunities.map((opp) => {
                const daysUntilDue = calculateDaysUntilDue(opp.due_date);
                
                return (
                  <div key={opp.id} className="p-6 hover:bg-gray-50 transition-colors">
                    <div className="flex justify-between items-start mb-3">
                      <div className="flex-1">
                        <div className="flex items-start gap-3 mb-2">
                          <div className="flex-1">
                            <h3 className="font-semibold text-lg text-gray-900 mb-1">
                              {opp.title}
                            </h3>
                            <p className="text-sm text-gray-500">
                              {opp.solicitation_number}
                            </p>
                          </div>
                          {opp.relevance_score !== null && opp.relevance_score > 0 && (
                            <div className="flex items-center gap-1 px-3 py-1 bg-green-100 text-green-800 rounded-full text-sm font-medium">
                              <TrendingUp className="w-4 h-4" />
                              {opp.relevance_score}% Match
                            </div>
                          )}
                        </div>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-3">
                      <div className="flex items-center gap-2 text-sm text-gray-600">
                        <MapPin className="w-4 h-4 text-gray-400" />
                        <span>{opp.jurisdiction?.name || 'Unknown'}</span>
                      </div>

                      <div className="flex items-center gap-2 text-sm text-gray-600">
                        <Building className="w-4 h-4 text-gray-400" />
                        <span>{opp.agency}</span>
                      </div>

                      {opp.total_value && (
                        <div className="flex items-center gap-2 text-sm text-gray-600">
                          <DollarSign className="w-4 h-4 text-gray-400" />
                          <span>${opp.total_value.toLocaleString()}</span>
                        </div>
                      )}
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-3 text-sm">
                      {opp.mbe_goal !== null && (
                        <div>
                          <strong className="text-gray-700">MBE Goal:</strong>{' '}
                          <span className="text-blue-600 font-semibold">{opp.mbe_goal}%</span>
                        </div>
                      )}

                      {opp.vsbe_goal !== null && (
                        <div>
                          <strong className="text-gray-700">VSBE Goal:</strong>{' '}
                          <span className="text-purple-600 font-semibold">{opp.vsbe_goal}%</span>
                        </div>
                      )}

                      {daysUntilDue !== null && (
                        <div className="flex items-center gap-2">
                          <Calendar className="w-4 h-4 text-gray-400" />
                          <span className={getDueDateColor(daysUntilDue)}>
                            Due in {daysUntilDue} days
                          </span>
                        </div>
                      )}
                    </div>

                    {opp.naics_codes && opp.naics_codes.length > 0 && (
                      <div className="text-sm text-gray-600 mb-3">
                        <strong>NAICS:</strong> {opp.naics_codes.join(', ')}
                      </div>
                    )}

                    <div className="flex gap-2 mt-4">
                      <button
                        onClick={() => handleViewAssessment(opp.id)}
                        className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 flex items-center gap-2 text-sm"
                      >
                        <TrendingUp className="w-4 h-4" />
                        Run Pre-Bid Assessment
                      </button>

                      {opp.opportunity_url && (
                        <a
                          href={opp.opportunity_url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="px-4 py-2 bg-gray-200 text-gray-700 rounded-md hover:bg-gray-300 flex items-center gap-2 text-sm"
                        >
                          <ExternalLink className="w-4 h-4" />
                          View Solicitation
                        </a>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default OpportunitiesPage;