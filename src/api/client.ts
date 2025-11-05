import axios from 'axios';
import {
  Bid,
  BidCreateRequest,
  BidSubcontractor,
  BidSubcontractorCreateRequest,
  Subcontractor,
  Organization,
  OrganizationCreateRequest,
  ValidationResponse
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

export default apiClient;