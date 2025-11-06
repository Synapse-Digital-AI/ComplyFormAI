import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { complianceRulesApi, jurisdictionsApi } from '../api/client';
import { ComplianceRule, Jurisdiction, ComplianceRuleCreate } from '../types';
import {
  ArrowLeft,
  Plus,
  Edit2,
  Trash2,
  AlertCircle,
  CheckCircle,
  AlertTriangle,
  Shield,
  Info
} from 'lucide-react';

const ComplianceRulesPage: React.FC = () => {
  const navigate = useNavigate();
  const [rules, setRules] = useState<ComplianceRule[]>([]);
  const [jurisdictions, setJurisdictions] = useState<Jurisdiction[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const [showCreateForm, setShowCreateForm] = useState(false);
  const [editingRule, setEditingRule] = useState<ComplianceRule | null>(null);
  const [selectedJurisdiction, setSelectedJurisdiction] = useState<string>('');

  const [formData, setFormData] = useState<ComplianceRuleCreate>({
    jurisdiction_id: '',
    rule_name: '',
    rule_type: 'MBE',
    rule_definition: {
      threshold: 0,
      description: ''
    },
    severity: 'ERROR'
  });

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const [rulesResponse, jurisdictionsResponse] = await Promise.all([
        complianceRulesApi.getAll(),
        jurisdictionsApi.getAll()
      ]);
      setRules(rulesResponse.data);
      setJurisdictions(jurisdictionsResponse.data);
    } catch (err) {
      console.error('Failed to load data:', err);
      setError('Failed to load compliance rules');
    } finally {
      setLoading(false);
    }
  };

  const handleFilterByJurisdiction = async (jurisdictionId: string) => {
    setSelectedJurisdiction(jurisdictionId);
    
    if (!jurisdictionId) {
      loadData();
      return;
    }

    setLoading(true);
    try {
      const response = await complianceRulesApi.getByJurisdiction(jurisdictionId);
      setRules(response.data);
    } catch (err) {
      console.error('Failed to filter rules:', err);
      setError('Failed to filter rules');
    } finally {
      setLoading(false);
    }
  };

  const handleCreateRule = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setSuccess(null);

    try {
      await complianceRulesApi.create(formData);
      setSuccess('Compliance rule created successfully!');
      setShowCreateForm(false);
      resetForm();
      await loadData();
      setTimeout(() => setSuccess(null), 3000);
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Failed to create rule');
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateRule = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingRule) return;

    setLoading(true);
    setError(null);
    setSuccess(null);

    try {
      await complianceRulesApi.update(editingRule.id, {
        rule_name: formData.rule_name,
        rule_type: formData.rule_type,
        rule_definition: formData.rule_definition,
        severity: formData.severity
      });
      setSuccess('Compliance rule updated successfully!');
      setEditingRule(null);
      resetForm();
      await loadData();
      setTimeout(() => setSuccess(null), 3000);
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Failed to update rule');
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteRule = async (id: string, ruleName: string) => {
    if (!window.confirm(`Are you sure you want to delete the rule "${ruleName}"?`)) {
      return;
    }

    setError(null);
    setSuccess(null);

    try {
      await complianceRulesApi.delete(id);
      setSuccess('Compliance rule deleted successfully!');
      await loadData();
      setTimeout(() => setSuccess(null), 3000);
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Failed to delete rule');
    }
  };

  const handleEditClick = (rule: ComplianceRule) => {
    setEditingRule(rule);
    setFormData({
      jurisdiction_id: rule.jurisdiction_id,
      rule_name: rule.rule_name,
      rule_type: rule.rule_type,
      rule_definition: rule.rule_definition,
      severity: rule.severity
    });
    setShowCreateForm(false);
  };

  const resetForm = () => {
    setFormData({
      jurisdiction_id: '',
      rule_name: '',
      rule_type: 'MBE',
      rule_definition: {
        threshold: 0,
        description: ''
      },
      severity: 'ERROR'
    });
    setEditingRule(null);
  };

  const getSeverityIcon = (severity: string) => {
    switch (severity) {
      case 'ERROR':
        return <AlertCircle className="w-5 h-5 text-red-500" />;
      case 'WARNING':
        return <AlertTriangle className="w-5 h-5 text-yellow-500" />;
      case 'INFO':
        return <Info className="w-5 h-5 text-blue-500" />;
      default:
        return <Shield className="w-5 h-5 text-gray-500" />;
    }
  };

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'ERROR':
        return 'bg-red-100 text-red-800 border-red-200';
      case 'WARNING':
        return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'INFO':
        return 'bg-blue-100 text-blue-800 border-blue-200';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getRuleTypeColor = (ruleType: string) => {
    switch (ruleType) {
      case 'MBE':
        return 'bg-blue-100 text-blue-800';
      case 'VSBE':
        return 'bg-purple-100 text-purple-800';
      case 'LOCAL_PREF':
        return 'bg-green-100 text-green-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  if (loading && rules.length === 0) {
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
            Compliance Rules Management
          </h1>
          <p className="text-gray-600">
            Manage jurisdiction-specific compliance rules for validation
          </p>
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

        {/* Filters and Actions */}
        <div className="bg-white rounded-lg shadow-md p-6 mb-6">
          <div className="flex justify-between items-end gap-4">
            <div className="flex-1">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Filter by Jurisdiction
              </label>
              <select
                value={selectedJurisdiction}
                onChange={(e) => handleFilterByJurisdiction(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="">All Jurisdictions</option>
                {jurisdictions.map((j) => (
                  <option key={j.id} value={j.id}>
                    {j.name} ({j.code})
                  </option>
                ))}
              </select>
            </div>

            <button
              onClick={() => {
                setShowCreateForm(!showCreateForm);
                setEditingRule(null);
                resetForm();
              }}
              className="px-6 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 flex items-center gap-2"
            >
              <Plus className="w-5 h-5" />
              Create Rule
            </button>
          </div>
        </div>

        {/* Create/Edit Form */}
        {(showCreateForm || editingRule) && (
          <div className="bg-white rounded-lg shadow-md p-6 mb-6">
            <h3 className="text-lg font-semibold mb-4">
              {editingRule ? 'Edit Compliance Rule' : 'Create New Compliance Rule'}
            </h3>

            <form onSubmit={editingRule ? handleUpdateRule : handleCreateRule} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Jurisdiction *
                  </label>
                  <select
                    value={formData.jurisdiction_id}
                    onChange={(e) => setFormData({ ...formData, jurisdiction_id: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    required
                    disabled={!!editingRule}
                  >
                    <option value="">Select Jurisdiction</option>
                    {jurisdictions.map((j) => (
                      <option key={j.id} value={j.id}>
                        {j.name} ({j.code})
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Rule Name *
                  </label>
                  <input
                    type="text"
                    value={formData.rule_name}
                    onChange={(e) => setFormData({ ...formData, rule_name: e.target.value })}
                    placeholder="e.g., MBE Minimum Goal"
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Rule Type *
                  </label>
                  <select
                    value={formData.rule_type}
                    onChange={(e) => setFormData({ ...formData, rule_type: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    required
                  >
                    <option value="MBE">MBE</option>
                    <option value="VSBE">VSBE</option>
                    <option value="DBE">DBE</option>
                    <option value="LOCAL_PREF">Local Preference</option>
                    <option value="NAICS">NAICS Validation</option>
                    <option value="CERTIFICATION">Certification Check</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Severity *
                  </label>
                  <select
                    value={formData.severity}
                    onChange={(e) => setFormData({ ...formData, severity: e.target.value as 'ERROR' | 'WARNING' | 'INFO' })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    required
                  >
                    <option value="ERROR">Error (Blocks submission)</option>
                    <option value="WARNING">Warning (Allows with notice)</option>
                    <option value="INFO">Info (Informational only)</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Threshold (%)
                </label>
                <input
                  type="number"
                  step="0.01"
                  min="0"
                  max="100"
                  value={formData.rule_definition.threshold || ''}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      rule_definition: {
                        ...formData.rule_definition,
                        threshold: parseFloat(e.target.value)
                      }
                    })
                  }
                  placeholder="e.g., 29.0"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Description
                </label>
                <textarea
                  value={formData.rule_definition.description || ''}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      rule_definition: {
                        ...formData.rule_definition,
                        description: e.target.value
                      }
                    })
                  }
                  rows={3}
                  placeholder="Describe the rule and requirements..."
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div className="flex gap-2">
                <button
                  type="submit"
                  disabled={loading}
                  className="px-6 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {loading ? 'Saving...' : editingRule ? 'Update Rule' : 'Create Rule'}
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setShowCreateForm(false);
                    setEditingRule(null);
                    resetForm();
                  }}
                  className="px-6 py-2 bg-gray-300 text-gray-700 rounded-md hover:bg-gray-400"
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        )}

        {/* Rules List */}
        <div className="bg-white rounded-lg shadow-md overflow-hidden">
          <div className="px-6 py-4 bg-gray-50 border-b border-gray-200">
            <h2 className="text-xl font-semibold text-gray-800">
              Compliance Rules ({rules.length})
            </h2>
          </div>

          {rules.length === 0 ? (
            <div className="p-12 text-center text-gray-500">
              <Shield className="w-16 h-16 mx-auto mb-4 text-gray-400" />
              <p>No compliance rules found.</p>
              {selectedJurisdiction && (
                <p className="text-sm mt-2">Try selecting a different jurisdiction or create a new rule.</p>
              )}
            </div>
          ) : (
            <div className="divide-y divide-gray-200">
              {rules.map((rule) => (
                <div key={rule.id} className="p-6 hover:bg-gray-50 transition-colors">
                  <div className="flex justify-between items-start">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-3">
                        {getSeverityIcon(rule.severity)}
                        <h3 className="font-semibold text-lg text-gray-900">
                          {rule.rule_name}
                        </h3>
                        <span className={`px-2 py-1 text-xs font-medium rounded ${getRuleTypeColor(rule.rule_type)}`}>
                          {rule.rule_type}
                        </span>
                        <span className={`px-2 py-1 text-xs font-medium rounded border ${getSeverityColor(rule.severity)}`}>
                          {rule.severity}
                        </span>
                      </div>

                      <div className="space-y-2 text-sm text-gray-600">
                        <p>
                          <strong>Jurisdiction:</strong>{' '}
                          {rule.jurisdiction?.name || 'Unknown'} ({rule.jurisdiction?.code || 'N/A'})
                        </p>

                        {rule.rule_definition.threshold !== undefined && (
                          <p>
                            <strong>Threshold:</strong> {rule.rule_definition.threshold}%
                          </p>
                        )}

                        {rule.rule_definition.description && (
                          <p>
                            <strong>Description:</strong> {rule.rule_definition.description}
                          </p>
                        )}
                      </div>
                    </div>

                    <div className="flex gap-2 ml-4">
                      <button
                        onClick={() => handleEditClick(rule)}
                        className="p-2 text-blue-600 hover:bg-blue-50 rounded-md transition-colors"
                        title="Edit rule"
                      >
                        <Edit2 className="w-5 h-5" />
                      </button>
                      <button
                        onClick={() => handleDeleteRule(rule.id, rule.rule_name)}
                        className="p-2 text-red-600 hover:bg-red-50 rounded-md transition-colors"
                        title="Delete rule"
                      >
                        <Trash2 className="w-5 h-5" />
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ComplianceRulesPage;