import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { organizationsApi } from '../api/client';
import { Organization } from '../types';
import { Plus, Building2, ArrowLeft, Trash2, AlertCircle, CheckCircle } from 'lucide-react';

const OrganizationManagementPage: React.FC = () => {
  const navigate = useNavigate();
  const [organizations, setOrganizations] = useState<Organization[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  
  const [newOrgName, setNewOrgName] = useState('');
  const [creating, setCreating] = useState(false);

  useEffect(() => {
    loadOrganizations();
  }, []);

  const loadOrganizations = async () => {
    try {
      const response = await organizationsApi.getAll();
      setOrganizations(response.data);
    } catch (err) {
      console.error('Failed to load organizations:', err);
      setError('Failed to load organizations');
    } finally {
      setLoading(false);
    }
  };

  const handleCreateOrganization = async (e: React.FormEvent) => {
    e.preventDefault();
    setCreating(true);
    setError(null);
    setSuccess(null);

    try {
      await organizationsApi.create({ name: newOrgName });
      setSuccess('Organization created successfully!');
      setNewOrgName('');
      setShowCreateForm(false);
      await loadOrganizations();
      
      setTimeout(() => setSuccess(null), 3000);
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Failed to create organization');
    } finally {
      setCreating(false);
    }
  };

  const handleViewOrganization = async (id: string) => {
    try {
      const response = await organizationsApi.getById(id);
      console.log('Organization details:', response.data);
      // You can navigate to a detail page or show a modal here
      alert(`Organization: ${response.data.name}\nID: ${response.data.id}`);
    } catch (err) {
      console.error('Failed to fetch organization:', err);
      setError('Failed to fetch organization details');
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="inline-block w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-6xl mx-auto px-4">
        {/* Header */}
        <button
          onClick={() => navigate('/')}
          className="flex items-center gap-2 text-gray-600 hover:text-gray-900 mb-6 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to Home
        </button>

        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Organization Management</h1>
          <p className="text-gray-600">Manage your organizations and view details</p>
        </div>

        {/* Success/Error Messages */}
        {error && (
          <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-md flex items-start">
            <AlertCircle className="w-5 h-5 text-red-500 mr-2 flex-shrink-0 mt-0.5" />
            <p className="text-red-700 text-sm">{error}</p>
          </div>
        )}

        {success && (
          <div className="mb-4 p-4 bg-green-50 border border-green-200 rounded-md flex items-start">
            <CheckCircle className="w-5 h-5 text-green-500 mr-2 flex-shrink-0 mt-0.5" />
            <p className="text-green-700 text-sm">{success}</p>
          </div>
        )}

        {/* Create Organization Button/Form */}
        {!showCreateForm ? (
          <button
            onClick={() => setShowCreateForm(true)}
            className="mb-6 flex items-center gap-2 px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors shadow-md"
          >
            <Plus className="w-5 h-5" />
            Create New Organization
          </button>
        ) : (
          <div className="mb-6 bg-white rounded-lg shadow-md p-6">
            <h3 className="text-lg font-semibold mb-4">Create New Organization</h3>
            <form onSubmit={handleCreateOrganization} className="flex gap-4">
              <input
                type="text"
                value={newOrgName}
                onChange={(e) => setNewOrgName(e.target.value)}
                placeholder="Organization Name"
                className="flex-1 px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                required
              />
              <button
                type="submit"
                disabled={creating}
                className="px-6 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {creating ? 'Creating...' : 'Create'}
              </button>
              <button
                type="button"
                onClick={() => {
                  setShowCreateForm(false);
                  setNewOrgName('');
                }}
                className="px-6 py-2 bg-gray-300 text-gray-700 rounded-md hover:bg-gray-400"
              >
                Cancel
              </button>
            </form>
          </div>
        )}

        {/* Organizations List */}
        <div className="bg-white rounded-lg shadow-md overflow-hidden">
          <div className="px-6 py-4 bg-gray-50 border-b border-gray-200">
            <h2 className="text-xl font-semibold text-gray-800">Organizations</h2>
          </div>

          {organizations.length === 0 ? (
            <div className="p-12 text-center text-gray-500">
              <Building2 className="w-16 h-16 mx-auto mb-4 text-gray-400" />
              <p>No organizations yet. Create your first organization above.</p>
            </div>
          ) : (
            <div className="divide-y divide-gray-200">
              {organizations.map((org) => (
                <div
                  key={org.id}
                  className="p-6 hover:bg-gray-50 transition-colors flex justify-between items-center"
                >
                  <div className="flex items-center gap-4">
                    <Building2 className="w-8 h-8 text-blue-600" />
                    <div>
                      <h3 className="font-semibold text-lg text-gray-900">{org.name}</h3>
                      <p className="text-sm text-gray-500">ID: {org.id}</p>
                    </div>
                  </div>
                  <button
                    onClick={() => handleViewOrganization(org.id)}
                    className="px-4 py-2 text-blue-600 hover:bg-blue-50 rounded-md transition-colors"
                  >
                    View Details
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default OrganizationManagementPage;