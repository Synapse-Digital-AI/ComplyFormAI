import axios from 'axios';
import {
  Bid,
  BidCreateRequest,
  BidSubcontractor,
  BidSubcontractorCreateRequest,
  Subcontractor,
  Organization,
  OrganizationCreateRequest,
  ValidationResponse,
  Jurisdiction,
  JurisdictionCreateRequest,
  SubcontractorDirectory,
  SubcontractorDirectoryCreate,
  SubcontractorDirectoryUpdate,
  SubcontractorSearchFilters,
  Opportunity,
  OpportunityCreate,
  OpportunitySearchFilters,
  PreBidAssessment,
  AssessmentRequest,
  SubcontractorOutreach,
  SubcontractorOutreachCreate,
  SubcontractorOutreachUpdate,
  ComplianceRule,
  ComplianceRuleCreate,
  ComplianceRuleUpdate
} from '../types';

const API_BASE = 'http://localhost:8000/api/v1';

const apiClient = axios.create({
  baseURL: API_BASE,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Organizations
export const organizationsApi = {
  getAll: () => apiClient.get<Organization[]>('/organizations'),
  getById: (id: string) => apiClient.get<Organization>(`/organizations/${id}`),
  create: (data: OrganizationCreateRequest) => 
    apiClient.post<Organization>('/organizations/', data),
};

// Subcontractors
export const subcontractorsApi = {
  getAll: () => apiClient.get<Subcontractor[]>('/subcontractors/'),
  getById: (id: string) => apiClient.get<Subcontractor>(`/subcontractors/${id}`),
  search: (query?: string, isMbe?: boolean) => {
    const params = new URLSearchParams();
    if (query) params.append('q', query);
    if (isMbe !== undefined) params.append('is_mbe', String(isMbe));
    return apiClient.get<Subcontractor[]>(`/subcontractors/search?${params.toString()}`);
  },
  update: (id: string, data: { legal_name?: string; certification_number?: string }) =>
    apiClient.put<Subcontractor>(`/subcontractors/${id}`, data),
  delete: (id: string) => apiClient.delete(`/subcontractors/${id}`),
};

// Bids
export const bidsApi = {
  getAll: () => apiClient.get<Bid[]>('/bids/'),
  getById: (id: string) => apiClient.get<Bid>(`/bids/${id}`),
  create: (data: BidCreateRequest) => apiClient.post<Bid>('/bids/', data),
  addSubcontractor: (bidId: string, data: BidSubcontractorCreateRequest) =>
    apiClient.post<BidSubcontractor>(`/bids/${bidId}/subcontractors`, data),
  removeSubcontractor: (bidId: string, bidSubId: string) =>
    apiClient.delete(`/bids/${bidId}/subcontractors/${bidSubId}`),
  validate: (bidId: string) => 
    apiClient.get<ValidationResponse>(`/bids/${bidId}/validate`),
};

// Jurisdictions
export const jurisdictionsApi = {
  getAll: () => apiClient.get<Jurisdiction[]>('/jurisdictions'),
  getById: (id: string) => apiClient.get<Jurisdiction>(`/jurisdictions/${id}`),
  getByCode: (code: string) => apiClient.get<Jurisdiction>(`/jurisdictions/code/${code}`),
  create: (data: JurisdictionCreateRequest) => 
    apiClient.post<Jurisdiction>('/jurisdictions/', data),
};

// Subcontractor Directory
export const directoryApi = {
  getAll: (skip: number = 0, limit: number = 100) => 
    apiClient.get<SubcontractorDirectory[]>(`/directory?skip=${skip}&limit=${limit}`),
  getById: (id: string) => apiClient.get<SubcontractorDirectory>(`/directory/${id}`),
  create: (data: SubcontractorDirectoryCreate) => 
    apiClient.post<SubcontractorDirectory>('/directory/', data),
  update: (id: string, data: SubcontractorDirectoryUpdate) =>
    apiClient.put<SubcontractorDirectory>(`/directory/${id}`, data),
  delete: (id: string) => apiClient.delete(`/directory/${id}`),
  search: (filters: SubcontractorSearchFilters) =>
    apiClient.post<SubcontractorDirectory[]>('/directory/search', filters),
  simpleSearch: (params: {
    q?: string;
    jurisdiction?: string;
    naics?: string;
    is_mbe?: boolean;
    is_vsbe?: boolean;
    is_verified?: boolean;
    min_rating?: number;
  }) => {
    const searchParams = new URLSearchParams();
    Object.entries(params).forEach(([key, value]) => {
      if (value !== undefined && value !== null) {
        searchParams.append(key, String(value));
      }
    });
    return apiClient.get<SubcontractorDirectory[]>(
      `/directory/search/simple?${searchParams.toString()}`
    );
  },
  findMatchingForOpportunity: (
    opportunityId: string,
    is_mbe?: boolean,
    is_vsbe?: boolean,
    min_rating: number = 2.0
  ) => {
    const params = new URLSearchParams();
    if (is_mbe !== undefined) params.append('is_mbe', String(is_mbe));
    if (is_vsbe !== undefined) params.append('is_vsbe', String(is_vsbe));
    params.append('min_rating', String(min_rating));
    return apiClient.get<SubcontractorDirectory[]>(
      `/directory/match/opportunity/${opportunityId}?${params.toString()}`
    );
  }
};

// Opportunities
export const opportunitiesApi = {
  getAll: (skip: number = 0, limit: number = 100, isActive: boolean = true) => 
    apiClient.get<Opportunity[]>(
      `/opportunities?skip=${skip}&limit=${limit}&is_active=${isActive}`
    ),
  getById: (id: string) => apiClient.get<Opportunity>(`/opportunities/${id}`),
  create: (data: OpportunityCreate) => 
    apiClient.post<Opportunity>('/opportunities/', data),
  update: (id: string, data: Partial<OpportunityCreate>) =>
    apiClient.put<Opportunity>(`/opportunities/${id}`, data),
  deactivate: (id: string) => 
    apiClient.post(`/opportunities/${id}/deactivate`),
  search: (filters: OpportunitySearchFilters) =>
    apiClient.post<Opportunity[]>('/opportunities/search', filters),
  simpleSearch: (params: {
    jurisdiction?: string;
    naics?: string;
    min_value?: number;
    max_value?: number;
    is_active?: boolean;
    days_until_due?: number;
  }) => {
    const searchParams = new URLSearchParams();
    Object.entries(params).forEach(([key, value]) => {
      if (value !== undefined && value !== null) {
        searchParams.append(key, String(value));
      }
    });
    return apiClient.get<Opportunity[]>(
      `/opportunities/search/simple?${searchParams.toString()}`
    );
  },
  getByJurisdiction: (jurisdictionId: string) =>
    apiClient.get<Opportunity[]>(`/opportunities/jurisdiction/${jurisdictionId}`),
  getRelevantOpportunities: (
    organizationNaics: string[],
    organizationJurisdictions: string[],
    minRelevance: number = 50
  ) => {
    const params = new URLSearchParams();
    organizationNaics.forEach(naics => params.append('organization_naics', naics));
    organizationJurisdictions.forEach(j => params.append('organization_jurisdictions', j));
    params.append('min_relevance', String(minRelevance));
    return apiClient.get<Opportunity[]>(
      `/opportunities/alerts/relevant?${params.toString()}`
    );
  }
};

// Pre-Bid Assessments
export const assessmentsApi = {
  perform: (data: AssessmentRequest) =>
    apiClient.post<PreBidAssessment>('/assessments/perform', data),
  getById: (id: string) => apiClient.get<PreBidAssessment>(`/assessments/${id}`),
  getByOrganization: (organizationId: string) =>
    apiClient.get<PreBidAssessment[]>(`/assessments/organization/${organizationId}`),
  getSummary: (organizationId: string) =>
    apiClient.get<{
      total_assessments: number;
      bid_recommended: number;
      caution_recommended: number;
      no_bid_recommended: number;
      average_risk_score: number;
    }>(`/assessments/organization/${organizationId}/summary`)
};

// Subcontractor Outreach
export const outreachApi = {
  create: (data: SubcontractorOutreachCreate) =>
    apiClient.post<SubcontractorOutreach>('/outreach/', data),
  getById: (id: string) => apiClient.get<SubcontractorOutreach>(`/outreach/${id}`),
  getByOpportunity: (opportunityId: string) =>
    apiClient.get<SubcontractorOutreach[]>(`/outreach/opportunity/${opportunityId}`),
  getByOrganization: (organizationId: string) =>
    apiClient.get<SubcontractorOutreach[]>(`/outreach/organization/${organizationId}`),
  getBySubcontractor: (subcontractorId: string) =>
    apiClient.get<SubcontractorOutreach[]>(`/outreach/subcontractor/${subcontractorId}`),
  update: (id: string, data: SubcontractorOutreachUpdate) =>
    apiClient.put<SubcontractorOutreach>(`/outreach/${id}`, data),
  delete: (id: string) => apiClient.delete(`/outreach/${id}`),
  getStatsByOpportunity: (opportunityId: string) =>
    apiClient.get<{
      total_outreach: number;
      contacted: number;
      responded: number;
      committed: number;
      declined: number;
      response_rate: number;
      commit_rate: number;
    }>(`/outreach/statistics/opportunity/${opportunityId}`),
  getStatsByOrganization: (organizationId: string) =>
    apiClient.get<{
      total_outreach: number;
      contacted: number;
      responded: number;
      committed: number;
      declined: number;
      response_rate: number;
      commit_rate: number;
    }>(`/outreach/statistics/organization/${organizationId}`)
};

// Compliance Rules
export const complianceRulesApi = {
  getAll: () => apiClient.get<ComplianceRule[]>('/compliance-rules'),
  getById: (id: string) => apiClient.get<ComplianceRule>(`/compliance-rules/${id}`),
  getByJurisdiction: (jurisdictionId: string) =>
    apiClient.get<ComplianceRule[]>(`/compliance-rules/jurisdiction/${jurisdictionId}`),
  create: (data: ComplianceRuleCreate) =>
    apiClient.post<ComplianceRule>('/compliance-rules/', data),
  update: (id: string, data: ComplianceRuleUpdate) =>
    apiClient.put<ComplianceRule>(`/compliance-rules/${id}`, data),
  delete: (id: string) => apiClient.delete(`/compliance-rules/${id}`)
};

export default apiClient;