import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { directoryApi, jurisdictionsApi } from '../api/client';
import { SubcontractorDirectory, Jurisdiction } from '../types';
import {
  ArrowLeft,
  Search,
  MapPin,
  Star,
  CheckCircle,
  Mail,
  Phone,
  Building,
  AlertCircle
} from 'lucide-react';

const SubcontractorDirectoryPage: React.FC = () => {
  const navigate = useNavigate();
  const [subcontractors, setSubcontractors] = useState<SubcontractorDirectory[]>([]);
  const [jurisdictions, setJurisdictions] = useState<Jurisdiction[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [filters, setFilters] = useState({
    query: '',
    jurisdiction: '',
    naics: '',
    is_mbe: undefined as boolean | undefined,
    is_vsbe: undefined as boolean | undefined,
    is_verified: undefined as boolean | undefined,
    min_rating: undefined as number | undefined,
  });

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const [subsResponse, jurisdictionsResponse] = await Promise.all([
        directoryApi.getAll(),
        jurisdictionsApi.getAll(),
      ]);
      setSubcontractors(subsResponse.data);
      setJurisdictions(jurisdictionsResponse.data);
    } catch (err) {
      console.error('Failed to load data:', err);
      setError('Failed to load subcontractor directory');
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = async () => {
    setLoading(true);
    setError(null);

    try {
      const response = await directoryApi.simpleSearch({
        q: filters.query || undefined,
        jurisdiction: filters.jurisdiction || undefined,
        naics: filters.naics || undefined,
        is_mbe: filters.is_mbe,
        is_vsbe: filters.is_vsbe,
        is_verified: filters.is_verified,
        min_rating: filters.min_rating,
      });
      setSubcontractors(response.data);
    } catch (err) {
      console.error('Search failed:', err);
      setError('Search failed');
    } finally {
      setLoading(false);
    }
  };

  const handleClearFilters = () => {
    setFilters({
      query: '',
      jurisdiction: '',
      naics: '',
      is_mbe: undefined,
      is_vsbe: undefined,
      is_verified: undefined,
      min_rating: undefined,
    });
    loadData();
  };

  const renderRating = (rating: number) => {
    return (
      <div className="flex items-center gap-1">
        {[...Array(5)].map((_, i) => (
          <Star
            key={i}
            className={`w-4 h-4 ${
              i < Math.floor(rating)
                ? 'fill-yellow-400 text-yellow-400'
                : 'text-gray-300'
            }`}
          />
        ))}
        <span className="ml-1 text-sm text-gray-600">({rating.toFixed(1)})</span>
      </div>
    );
  };

  if (loading && subcontractors.length === 0) {
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
            Subcontractor Directory
          </h1>
          <p className="text-gray-600">
            Search for certified subcontractors across Maryland and DC
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
                Search Name
              </label>
              <input
                type="text"
                value={filters.query}
                onChange={(e) => setFilters({ ...filters, query: e.target.value })}
                onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
                placeholder="Company name..."
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

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
                Min Rating
              </label>
              <select
                value={filters.min_rating || ''}
                onChange={(e) =>
                  setFilters({
                    ...filters,
                    min_rating: e.target.value ? parseFloat(e.target.value) : undefined,
                  })
                }
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="">Any Rating</option>
                <option value="2.0">2.0+</option>
                <option value="3.0">3.0+</option>
                <option value="4.0">4.0+</option>
              </select>
            </div>
          </div>

          <div className="flex gap-3 mb-4">
            <label className="flex items-center">
              <input
                type="checkbox"
                checked={filters.is_mbe === true}
                onChange={(e) =>
                  setFilters({ ...filters, is_mbe: e.target.checked ? true : undefined })
                }
                className="h-4 w-4 text-blue-600 rounded focus:ring-2 focus:ring-blue-500"
              />
              <span className="ml-2 text-sm text-gray-700">MBE Only</span>
            </label>

            <label className="flex items-center">
              <input
                type="checkbox"
                checked={filters.is_vsbe === true}
                onChange={(e) =>
                  setFilters({ ...filters, is_vsbe: e.target.checked ? true : undefined })
                }
                className="h-4 w-4 text-blue-600 rounded focus:ring-2 focus:ring-blue-500"
              />
              <span className="ml-2 text-sm text-gray-700">VSBE Only</span>
            </label>

            <label className="flex items-center">
              <input
                type="checkbox"
                checked={filters.is_verified === true}
                onChange={(e) =>
                  setFilters({
                    ...filters,
                    is_verified: e.target.checked ? true : undefined,
                  })
                }
                className="h-4 w-4 text-blue-600 rounded focus:ring-2 focus:ring-blue-500"
              />
              <span className="ml-2 text-sm text-gray-700">Verified Only</span>
            </label>
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
              Results ({subcontractors.length})
            </h2>
          </div>

          {subcontractors.length === 0 ? (
            <div className="p-12 text-center text-gray-500">
              <Building className="w-16 h-16 mx-auto mb-4 text-gray-400" />
              <p>No subcontractors found matching your criteria.</p>
            </div>
          ) : (
            <div className="divide-y divide-gray-200">
              {subcontractors.map((sub) => (
                <div key={sub.id} className="p-6 hover:bg-gray-50 transition-colors">
                  <div className="flex justify-between items-start mb-3">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <h3 className="font-semibold text-lg text-gray-900">
                          {sub.legal_name}
                        </h3>
                        {sub.is_verified && (
                          <CheckCircle className="w-5 h-5 text-green-500" />
                        )}
                        {sub.certifications?.mbe && (
                          <span className="px-2 py-0.5 bg-blue-100 text-blue-800 text-xs font-medium rounded">
                            MBE
                          </span>
                        )}
                        {sub.certifications?.vsbe && (
                          <span className="px-2 py-0.5 bg-purple-100 text-purple-800 text-xs font-medium rounded">
                            VSBE
                          </span>
                        )}
                        {sub.certifications?.dbe && (
                          <span className="px-2 py-0.5 bg-green-100 text-green-800 text-xs font-medium rounded">
                            DBE
                          </span>
                        )}
                      </div>

                      {renderRating(sub.rating)}
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm text-gray-600 mb-3">
                    {sub.location_city && (
                      <div className="flex items-center gap-2">
                        <MapPin className="w-4 h-4 text-gray-400" />
                        <span>{sub.location_city}</span>
                      </div>
                    )}

                    {sub.contact_email && (
                      <div className="flex items-center gap-2">
                        <Mail className="w-4 h-4 text-gray-400" />
                        <span>{sub.contact_email}</span>
                      </div>
                    )}

                    {sub.phone && (
                      <div className="flex items-center gap-2">
                        <Phone className="w-4 h-4 text-gray-400" />
                        <span>{sub.phone}</span>
                      </div>
                    )}

                    <div>
                      <strong>Projects:</strong> {sub.projects_completed}
                    </div>
                  </div>

                  {sub.jurisdiction_codes && sub.jurisdiction_codes.length > 0 && (
                    <div className="text-sm text-gray-600 mb-2">
                      <strong>Jurisdictions:</strong>{' '}
                      {sub.jurisdiction_codes.join(', ')}
                    </div>
                  )}

                  {sub.naics_codes && sub.naics_codes.length > 0 && (
                    <div className="text-sm text-gray-600 mb-2">
                      <strong>NAICS Codes:</strong>{' '}
                      {sub.naics_codes.slice(0, 5).join(', ')}
                      {sub.naics_codes.length > 5 && ` +${sub.naics_codes.length - 5} more`}
                    </div>
                  )}

                  {sub.capabilities && (
                    <div className="text-sm text-gray-600 mt-3">
                      <strong>Capabilities:</strong>
                      <p className="mt-1">{sub.capabilities}</p>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default SubcontractorDirectoryPage;