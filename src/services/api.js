export function getApiBaseUrl() {
  // 1. Check explicit Vite environment variables (VITE_API_BASE_URL preferred, VITE_API_URL fallback)
  const envUrl = typeof import.meta !== 'undefined'
    ? (import.meta.env?.VITE_API_BASE_URL || import.meta.env?.VITE_API_URL || '')
    : '';

  let raw = (typeof envUrl === 'string' ? envUrl : '').trim();

  // 2. If environment variable is omitted, intelligently detect runtime environment
  if (!raw) {
    if (typeof window !== 'undefined') {
      const hostname = window.location.hostname;
      if (hostname === 'localhost' || hostname === '127.0.0.1' || hostname === '0.0.0.0') {
        raw = 'http://localhost:8000/api';
      } else {
        // Remotely deployed frontend should NEVER call localhost on developer's machine
        raw = 'https://mso.isp.backend.pmrgsolution.com/api';
      }
    } else {
      raw = 'http://localhost:8000/api';
    }
  }

  // 3. Normalize: strip trailing slashes and ensure /api path is present once
  raw = raw.replace(/\/+$/, '');
  if (!raw.endsWith('/api')) {
    raw = `${raw}/api`;
  }
  return raw;
}

export const API_BASE = getApiBaseUrl();

// In-memory cache for ultra-fast tab switches and responsive UI
const requestCache = new Map();
const inflightRequests = new Map();
const CACHE_TTL_MS = 45000; // 45 seconds cache TTL

function formatNetworkError(err, url) {
  if (err && (err.name === 'TypeError' || err.message?.includes('Failed to fetch') || err.message?.includes('NetworkError') || err.message?.includes('Network request failed'))) {
    const netErr = new Error(`Connection refused: SentinelOS backend at ${API_BASE} is unreachable. Please verify the backend service is running on port 8000.`);
    netErr.isNetworkError = true;
    netErr.status = 0;
    netErr.url = url;
    return netErr;
  }
  return err;
}

function getAuthHeaders() {
  const token = typeof localStorage !== 'undefined' ? localStorage.getItem('pmrg_token') : null;
  const market = typeof localStorage !== 'undefined' ? (localStorage.getItem('pmrg_market') || 'mumbai') : 'mumbai';
  return {
    'Content-Type': 'application/json',
    'X-Market-Id': market,
    ...(token ? { 'Authorization': `Bearer ${token}` } : {})
  };
}

async function handleResponse(res) {
  if (res.status === 401) {
    if (typeof localStorage !== 'undefined') {
      localStorage.removeItem('pmrg_token');
      localStorage.removeItem('pmrg_user');
    }
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new Event('auth-logout'));
    }
  }
  if (!res.ok) {
    const errorData = await res.json().catch(() => ({}));
    const USER_MESSAGES = {
      401: 'Your session has expired. Please sign in again.',
      403: "You don't have permission to access this resource.",
      404: 'The requested record was not found.',
      409: typeof errorData.detail === 'object' && errorData.detail?.message 
        ? errorData.detail.message 
        : (typeof errorData.detail === 'string' ? errorData.detail : 'Action conflict: Resource is at capacity or conflicting state.'),
      400: typeof errorData.detail === 'string' ? errorData.detail : 'The request could not be completed.',
      500: 'A server error occurred. Please try again shortly.',
    };
    const friendlyMessage = USER_MESSAGES[res.status] || (typeof errorData.detail === 'string' ? errorData.detail : `Request failed (${res.status})`);
    const err = new Error(friendlyMessage);
    err.status = res.status;
    err.data = errorData;
    throw err;
  }
  return res.json();
}

async function cachedFetch(url, options = {}, forceRefresh = false) {
  const market = typeof localStorage !== 'undefined' ? (localStorage.getItem('pmrg_market') || 'mumbai') : 'mumbai';
  const token = typeof localStorage !== 'undefined' ? localStorage.getItem('pmrg_token') : null;
  const authKey = token ? token.slice(-12) : 'anon';
  const cacheKey = `${url}::market=${market}::auth=${authKey}`;
  const now = Date.now();
  
  if (!forceRefresh && requestCache.has(cacheKey)) {
    const cached = requestCache.get(cacheKey);
    if (now - cached.timestamp < CACHE_TTL_MS) {
      return cached.data;
    }
  }

  // Deduplicate concurrent in-flight requests (prevents duplicate React renders from fetching twice)
  if (!forceRefresh && inflightRequests.has(cacheKey)) {
    return inflightRequests.get(cacheKey);
  }

  const fetchPromise = (async () => {
    try {
      const mergedOptions = {
        credentials: 'include',
        ...options
      };
      const res = await fetch(url, mergedOptions);
      const data = await handleResponse(res);
      requestCache.set(cacheKey, { timestamp: Date.now(), data });
      return data;
    } catch (err) {
      throw formatNetworkError(err, url);
    } finally {
      inflightRequests.delete(cacheKey);
    }
  })();

  inflightRequests.set(cacheKey, fetchPromise);
  return fetchPromise;
}

export function clearApiCache() {
  requestCache.clear();
  inflightRequests.clear();
}

async function secureFetch(url, options = {}) {
  const merged = {
    credentials: 'include',
    ...options
  };
  try {
    const res = await fetch(url, merged);
    return await handleResponse(res);
  } catch (err) {
    throw formatNetworkError(err, url);
  }
}

export const api = {
  clearCache: () => {
    requestCache.clear();
    inflightRequests.clear();
  },
  clearApiCache: () => {
    requestCache.clear();
    inflightRequests.clear();
  },
  signup: async (fullName, email, password, role = 'Viewer') => {
    clearApiCache();
    return secureFetch(`${API_BASE}/auth/signup`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ full_name: fullName, email, password, role })
    });
  },

  login: async (email, password) => {
    clearApiCache();
    return secureFetch(`${API_BASE}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password })
    });
  },

  logout: async () => {
    clearApiCache();
    try {
      await secureFetch(`${API_BASE}/auth/logout`, {
        method: 'POST',
        headers: getAuthHeaders()
      });
    } catch {
      // Best-effort logout on backend
    }
  },

  getMe: async () => {
    return secureFetch(`${API_BASE}/auth/me`, { headers: getAuthHeaders() });
  },

  getUsers: async () => {
    return cachedFetch(`${API_BASE}/auth/users`, { headers: getAuthHeaders() }, true);
  },

  adminCreateUser: async (userData) => {
    clearApiCache();
    const res = await fetch(`${API_BASE}/auth/users`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify(userData)
    });
    return handleResponse(res);
  },

  adminUpdateUser: async (userId, userData) => {
    clearApiCache();
    const res = await fetch(`${API_BASE}/auth/users/${userId}`, {
      method: 'PUT',
      headers: getAuthHeaders(),
      body: JSON.stringify(userData)
    });
    return handleResponse(res);
  },

  toggleUserStatus: async (userId, isActive) => {
    clearApiCache();
    const res = await fetch(`${API_BASE}/auth/users/${userId}/status`, {
      method: 'PATCH',
      headers: getAuthHeaders(),
      body: JSON.stringify({ is_active: isActive })
    });
    return handleResponse(res);
  },

  demoLogin: async (role) => {
    clearApiCache();
    return secureFetch(`${API_BASE}/auth/demo-login/${role}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' }
    });
  },

  getCockpitSummary: async (forceRefresh = false) => {
    return cachedFetch(`${API_BASE}/cockpit/summary`, { headers: getAuthHeaders() }, forceRefresh);
  },

  getNodePredictions: async (forceRefresh = false) => {
    return cachedFetch(`${API_BASE}/assurance/predictions`, { headers: getAuthHeaders() }, forceRefresh);
  },

  proposeAssuranceDispatch: async (nodeId, actionType, customNotes) => {
    clearApiCache();
    const res = await fetch(`${API_BASE}/assurance/recommend`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify({ node_id: nodeId, action_type: actionType, custom_notes: customNotes })
    });
    return handleResponse(res);
  },

  getAtRiskCustomers: async (minScore = 30, customerType = null, forceRefresh = false, limit = 60) => {
    let url = `${API_BASE}/churn/at-risk?min_score=${minScore}&limit=${limit}`;
    if (customerType) url += `&customer_type=${encodeURIComponent(customerType)}`;
    return cachedFetch(url, { headers: getAuthHeaders() }, forceRefresh);
  },

  proposeRetentionAction: async (customerId, actionType, customNotes) => {
    clearApiCache();
    const res = await fetch(`${API_BASE}/churn/recommend`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify({ customer_id: customerId, action_type: actionType, custom_notes: customNotes })
    });
    return handleResponse(res);
  },

  getJourneyNBAs: async (forceRefresh = false, limit = 60) => {
    return cachedFetch(`${API_BASE}/journeys/next-best-actions?limit=${limit}`, { headers: getAuthHeaders() }, forceRefresh);
  },

  getJourneyFunnelSummary: async (forceRefresh = false) => {
    return cachedFetch(`${API_BASE}/journeys/funnel-summary`, { headers: getAuthHeaders() }, forceRefresh);
  },

  proposeJourneyAction: async (customerId, actionType) => {
    clearApiCache();
    const res = await fetch(`${API_BASE}/journeys/recommend`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify({ customer_id: customerId, action_type: actionType })
    });
    return handleResponse(res);
  },

  getMarkets: async () => {
    return cachedFetch(`${API_BASE}/markets`, { headers: getAuthHeaders() });
  },

  getPilotBundleScenario: async (nodeCode = null, forceRefresh = false) => {
    const query = nodeCode ? `?node_code=${encodeURIComponent(nodeCode)}` : '';
    return cachedFetch(`${API_BASE}/pilot-bundle/scenario${query}`, { headers: getAuthHeaders() }, forceRefresh);
  },

  getOrchestrationQueue: async (forceRefresh = false, limit = 50) => {
    return cachedFetch(`${API_BASE}/orchestration/queue?limit=${limit}`, { headers: getAuthHeaders() }, forceRefresh);
  },

  proposeOrchestration: async (ticketId, workflowAction) => {
    clearApiCache();
    const res = await fetch(`${API_BASE}/orchestration/recommend`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify({ ticket_id: ticketId, workflow_action: workflowAction })
    });
    return handleResponse(res);
  },

  getRevenueLeakages: async (forceRefresh = false, limit = 50) => {
    return cachedFetch(`${API_BASE}/revenue/leakages?limit=${limit}`, { headers: getAuthHeaders() }, forceRefresh);
  },

  proposeRevenueRemediation: async (invoiceId, remediationAction) => {
    clearApiCache();
    const res = await fetch(`${API_BASE}/revenue/recommend`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify({ invoice_id: invoiceId, remediation_action: remediationAction })
    });
    return handleResponse(res);
  },

  getRecommendations: async (status, sourceModule, forceRefresh = false) => {
    let url = `${API_BASE}/governance/recommendations?`;
    if (status) url += `status=${encodeURIComponent(status)}&`;
    if (sourceModule) url += `source_module=${encodeURIComponent(sourceModule)}&`;
    return cachedFetch(url, { headers: getAuthHeaders() }, forceRefresh);
  },

  approveRecommendation: async (recommendationId, notes) => {
    clearApiCache();
    const res = await fetch(`${API_BASE}/governance/approve`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify({ recommendation_id: recommendationId, notes })
    });
    return handleResponse(res);
  },

  rejectRecommendation: async (recommendationId, notes) => {
    clearApiCache();
    const res = await fetch(`${API_BASE}/governance/reject`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify({ recommendation_id: recommendationId, notes })
    });
    return handleResponse(res);
  },

  getAuditTrail: async (sourceModule, decision, forceRefresh = false) => {
    let url = `${API_BASE}/governance/audit-trail?limit=100&`;
    if (sourceModule) url += `source_module=${encodeURIComponent(sourceModule)}&`;
    if (decision) url += `decision=${encodeURIComponent(decision)}&`;
    return cachedFetch(url, { headers: getAuthHeaders() }, forceRefresh);
  },

  getCustomers: async (search = '', locality = '', segment = '', customerType = '', status = '', stage = '', forceRefresh = false) => {
    let url = `${API_BASE}/customers?limit=100&`;
    if (search) url += `search=${encodeURIComponent(search)}&`;
    if (locality) url += `locality=${encodeURIComponent(locality)}&`;
    if (segment) url += `segment=${encodeURIComponent(segment)}&`;
    if (customerType) url += `customer_type=${encodeURIComponent(customerType)}&`;
    if (status) url += `status=${encodeURIComponent(status)}&`;
    if (stage) url += `stage=${encodeURIComponent(stage)}&`;
    return cachedFetch(url, { headers: getAuthHeaders() }, forceRefresh);
  },

  getCustomer360: async (customerId, forceRefresh = false) => {
    return cachedFetch(`${API_BASE}/customers/${customerId}/360`, { headers: getAuthHeaders() }, forceRefresh);
  },

  // ── CRM Customer Management, Contacts, Addresses, Leads, Maps & Vouchers ──
  createCustomer: async (customerData) => {
    clearApiCache();
    const res = await fetch(`${API_BASE}/customers`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify(customerData)
    });
    return handleResponse(res);
  },

  getCustomerDetail: async (idOrCode) => {
    return cachedFetch(`${API_BASE}/customers/${idOrCode}`, { headers: getAuthHeaders() }, true);
  },

  updateCustomer: async (idOrCode, updateData) => {
    clearApiCache();
    const res = await fetch(`${API_BASE}/customers/${idOrCode}`, {
      method: 'PUT',
      headers: getAuthHeaders(),
      body: JSON.stringify(updateData)
    });
    return handleResponse(res);
  },

  archiveCustomer: async (idOrCode) => {
    clearApiCache();
    const res = await fetch(`${API_BASE}/customers/${idOrCode}`, {
      method: 'DELETE',
      headers: getAuthHeaders()
    });
    return handleResponse(res);
  },

  getCustomerContacts: async (customerId) => {
    return cachedFetch(`${API_BASE}/customers/${customerId}/contacts`, { headers: getAuthHeaders() }, true);
  },

  createCustomerContact: async (customerId, contactData) => {
    clearApiCache();
    const res = await fetch(`${API_BASE}/customers/${customerId}/contacts`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify(contactData)
    });
    return handleResponse(res);
  },

  updateCustomerContact: async (customerId, contactId, contactData) => {
    clearApiCache();
    const res = await fetch(`${API_BASE}/customers/${customerId}/contacts/${contactId}`, {
      method: 'PUT',
      headers: getAuthHeaders(),
      body: JSON.stringify(contactData)
    });
    return handleResponse(res);
  },

  archiveCustomerContact: async (customerId, contactId) => {
    clearApiCache();
    const res = await fetch(`${API_BASE}/customers/${customerId}/contacts/${contactId}`, {
      method: 'DELETE',
      headers: getAuthHeaders()
    });
    return handleResponse(res);
  },

  getCustomerAddresses: async (customerId) => {
    return cachedFetch(`${API_BASE}/customers/${customerId}/addresses`, { headers: getAuthHeaders() }, true);
  },

  createCustomerAddress: async (customerId, addressData) => {
    clearApiCache();
    const res = await fetch(`${API_BASE}/customers/${customerId}/addresses`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify(addressData)
    });
    return handleResponse(res);
  },

  archiveCustomerAddress: async (customerId, addressId) => {
    clearApiCache();
    const res = await fetch(`${API_BASE}/customers/${customerId}/addresses/${addressId}`, {
      method: 'DELETE',
      headers: getAuthHeaders()
    });
    return handleResponse(res);
  },

  updateCustomerAddress: async (customerId, addressId, addressData) => {
    clearApiCache();
    const res = await fetch(`${API_BASE}/customers/${customerId}/addresses/${addressId}`, {
      method: 'PUT',
      headers: getAuthHeaders(),
      body: JSON.stringify(addressData)
    });
    return handleResponse(res);
  },

  completeAddressSurvey: async (customerId, addressId, surveyData) => {
    clearApiCache();
    const res = await fetch(`${API_BASE}/customers/${customerId}/addresses/${addressId}/survey-complete`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify(surveyData)
    });
    return handleResponse(res);
  },

  getCustomerDocuments: async (customerId) => {
    return cachedFetch(`${API_BASE}/customers/${customerId}/documents`, { headers: getAuthHeaders() }, true);
  },

  uploadCustomerDocument: async (customerId, formData) => {
    clearApiCache();
    const headers = getAuthHeaders();
    delete headers['Content-Type']; // Allow browser to set boundary
    const res = await fetch(`${API_BASE}/customers/${customerId}/documents`, {
      method: 'POST',
      headers,
      body: formData
    });
    return handleResponse(res);
  },

  downloadCustomerDocument: async (customerId, documentId) => {
    const res = await fetch(`${API_BASE}/customers/${customerId}/documents/${documentId}/download`, {
      headers: getAuthHeaders()
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({ detail: res.statusText }));
      throw new Error(err.detail || `Download failed (HTTP ${res.status})`);
    }
    const blob = await res.blob();
    const contentDisposition = res.headers.get('Content-Disposition') || '';
    let filename = `document_${documentId}`;
    const filenameMatch = contentDisposition.match(/filename="?([^"]+)"?/);
    if (filenameMatch && filenameMatch[1]) {
      filename = filenameMatch[1];
    }
    return { blob, filename };
  },

  verifyCustomerDocument: async (customerId, documentId, verificationData) => {
    clearApiCache();
    const res = await fetch(`${API_BASE}/customers/${customerId}/documents/${documentId}/verify`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify(verificationData)
    });
    return handleResponse(res);
  },

  archiveCustomerDocument: async (customerId, documentId) => {
    clearApiCache();
    const res = await fetch(`${API_BASE}/customers/${customerId}/documents/${documentId}`, {
      method: 'DELETE',
      headers: getAuthHeaders()
    });
    return handleResponse(res);
  },

  getLeads: async (search = '', status = '', forceRefresh = true) => {
    let url = `${API_BASE}/customers/leads?`;
    if (search) url += `search=${encodeURIComponent(search)}&`;
    if (status) url += `status=${encodeURIComponent(status)}&`;
    return cachedFetch(url, { headers: getAuthHeaders() }, forceRefresh);
  },

  createLead: async (leadData) => {
    clearApiCache();
    const res = await fetch(`${API_BASE}/customers/leads`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify(leadData)
    });
    return handleResponse(res);
  },

  convertLead: async (leadId, convertData = {}) => {
    clearApiCache();
    const res = await fetch(`${API_BASE}/customers/leads/${leadId}/convert`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify(convertData)
    });
    return handleResponse(res);
  },

  getCustomerMapLocations: async (forceRefresh = true) => {
    return cachedFetch(`${API_BASE}/customers/map-locations`, { headers: getAuthHeaders() }, forceRefresh);
  },

  getCustomerVouchers: async (customerId = null, forceRefresh = true) => {
    let url = `${API_BASE}/customers/vouchers`;
    if (customerId) url += `?customer_id=${customerId}`;
    return cachedFetch(url, { headers: getAuthHeaders() }, forceRefresh);
  },

  issueCustomerVoucher: async (customerId, voucherType = 'SPEED_BOOST') => {
    clearApiCache();
    const res = await fetch(`${API_BASE}/customers/${customerId}/vouchers/issue?voucher_type=${encodeURIComponent(voucherType)}`, {
      method: 'POST',
      headers: getAuthHeaders()
    });
    return handleResponse(res);
  },

  getCustomerTickets: async (customerId) => {
    return cachedFetch(`${API_BASE}/customers/${customerId}/tickets`, { headers: getAuthHeaders() }, true);
  },

  createCustomerTicket: async (customerId, ticketData) => {
    clearApiCache();
    const query = new URLSearchParams(ticketData).toString();
    const res = await fetch(`${API_BASE}/customers/${customerId}/tickets?${query}`, {
      method: 'POST',
      headers: getAuthHeaders()
    });
    return handleResponse(res);
  },

  // Automated Ticketing & Regional Resource Dispatch
  getTickets: async (filters = {}, forceRefresh = false) => {
    const limit = filters.limit || 250;
    let url = `${API_BASE}/tickets?limit=${limit}&`;
    if (filters.source) url += `source=${encodeURIComponent(filters.source)}&`;
    if (filters.priority) url += `priority=${encodeURIComponent(filters.priority)}&`;
    if (filters.approval_status) url += `approval_status=${encodeURIComponent(filters.approval_status)}&`;
    if (filters.status) url += `status=${encodeURIComponent(filters.status)}&`;
    if (filters.region) url += `region=${encodeURIComponent(filters.region)}&`;
    return cachedFetch(url, { headers: getAuthHeaders() }, forceRefresh);
  },

  getTicketStats: async (forceRefresh = false) => {
    return cachedFetch(`${API_BASE}/tickets/stats`, { headers: getAuthHeaders() }, forceRefresh);
  },

  getAutoDispatchSettings: async () => {
    return cachedFetch(`${API_BASE}/tickets/auto-dispatch-settings`, { headers: getAuthHeaders() }, true);
  },

  setAutoDispatchSettings: async (enabled) => {
    clearApiCache();
    const res = await fetch(`${API_BASE}/tickets/auto-dispatch-settings`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify({ enabled })
    });
    return handleResponse(res);
  },

  forceAutoDispatchNow: async () => {
    clearApiCache();
    const res = await fetch(`${API_BASE}/tickets/auto-dispatch-now`, {
      method: 'POST',
      headers: getAuthHeaders()
    });
    return handleResponse(res);
  },

  simulateAiAlert: async (data = {}) => {
    clearApiCache();
    const res = await fetch(`${API_BASE}/tickets/simulate-ai-alert`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify(data)
    });
    return handleResponse(res);
  },

  resetDemoState: async () => {
    clearApiCache();
    const res = await fetch(`${API_BASE}/tickets/reset-demo-state`, {
      method: 'POST',
      headers: getAuthHeaders()
    });
    return handleResponse(res);
  },

  getResources: async (resourceType = null, region = null, forceRefresh = false) => {
    let url = `${API_BASE}/tickets/resources?`;
    if (resourceType) url += `resource_type=${encodeURIComponent(resourceType)}&`;
    if (region) url += `region=${encodeURIComponent(region)}&`;
    return cachedFetch(url, { headers: getAuthHeaders() }, forceRefresh);
  },

  getResourceTimeline: async (resourceId, forceRefresh = false) => {
    return cachedFetch(`${API_BASE}/tickets/resources/${resourceId}/timeline`, { headers: getAuthHeaders() }, forceRefresh);
  },

  createTicket: async (ticketData) => {
    clearApiCache();
    const res = await fetch(`${API_BASE}/tickets`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify(ticketData)
    });
    return handleResponse(res);
  },

  approveTicket: async (ticketId, notes = '', resourceId = null) => {
    clearApiCache();
    const payload = { notes };
    if (resourceId) {
      payload.resource_id = Number(resourceId);
    }
    const res = await fetch(`${API_BASE}/tickets/${ticketId}/approve`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify(payload)
    });
    return handleResponse(res);
  },

  getTicketCallLogs: async (ticketId) => {
    return cachedFetch(`${API_BASE}/tickets/${ticketId}/call-logs`, { headers: getAuthHeaders() }, true);
  },

  getRecentTicketCalls: async () => {
    return cachedFetch(`${API_BASE}/tickets/calls/recent`, { headers: getAuthHeaders() }, true);
  },

  simulateTicketCall: async (ticketId) => {
    clearApiCache();
    const res = await fetch(`${API_BASE}/tickets/${ticketId}/simulate-call`, {
      method: 'POST',
      headers: getAuthHeaders()
    });
    return handleResponse(res);
  },

  rejectTicket: async (ticketId, notes = '') => {
    clearApiCache();
    const res = await fetch(`${API_BASE}/tickets/${ticketId}/reject`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify({ notes })
    });
    return handleResponse(res);
  },

  resolveTicket: async (ticketId, notes = '') => {
    clearApiCache();
    const res = await fetch(`${API_BASE}/tickets/${ticketId}/resolve`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify({ notes })
    });
    return handleResponse(res);
  },

  // --- Field Operations & Live Engineer Tracking ---
  // NOTE: All field tracking endpoints use secureFetch (uncached).
  // The 45-second cachedFetch TTL would serve stale GPS coordinates and kill real-time tracking.

  getFieldOpsSummary: async () => {
    return secureFetch(`${API_BASE}/field/summary`, { headers: getAuthHeaders() });
  },

  getFieldEngineers: async (status = null) => {
    const url = status ? `${API_BASE}/field/engineers?status=${encodeURIComponent(status)}` : `${API_BASE}/field/engineers`;
    return secureFetch(url, { headers: getAuthHeaders() });
  },

  getFieldJobs: async (status = null) => {
    const url = status ? `${API_BASE}/field/jobs?status=${encodeURIComponent(status)}` : `${API_BASE}/field/jobs`;
    return secureFetch(url, { headers: getAuthHeaders() });
  },

  getMyFieldJobs: async () => {
    return secureFetch(`${API_BASE}/field/my-jobs`, { headers: getAuthHeaders() });
  },

  getFieldJobDetail: async (jobId) => {
    return secureFetch(`${API_BASE}/field/jobs/${jobId}`, { headers: getAuthHeaders() });
  },

  transitionFieldJob: async (jobId, targetStatus, notes = '', latitude = null, longitude = null) => {
    clearApiCache();
    const payload = { target_status: targetStatus, notes };
    if (latitude !== null && longitude !== null) {
      payload.latitude = latitude;
      payload.longitude = longitude;
    }
    const res = await fetch(`${API_BASE}/field/jobs/${jobId}/transition`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify(payload)
    });
    return handleResponse(res);
  },

  sendLocationPing: async (jobId, {
    latitude,
    longitude,
    accuracy = 10.0,
    speed = 0.0,
    heading = 0.0,
    battery_level = 95,
    is_mock = false,
    recorded_at = null,
    accuracy_meters = null,
    speed_mps = null,
    heading_degrees = null
  }) => {
    const finalAccuracy = accuracy_meters !== null ? accuracy_meters : accuracy;
    const finalSpeed = speed_mps !== null ? speed_mps : speed;
    const finalHeading = heading_degrees !== null ? heading_degrees : heading;

    const payload = {
      latitude: Number(latitude),
      longitude: Number(longitude),
      accuracy: Math.max(0, Number(finalAccuracy)),
      speed: Math.max(0, Number(finalSpeed)),
      heading: Number(finalHeading),
      battery_level: battery_level !== null ? Number(battery_level) : null,
      is_mock: Boolean(is_mock),
      recorded_at: recorded_at || new Date().toISOString()
    };

    const res = await fetch(`${API_BASE}/field/jobs/${jobId}/ping`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify(payload)
    });
    return handleResponse(res);
  },

  requestFieldOtp: async (jobId, notes = '') => {
    if (!jobId || String(jobId) === 'undefined' || String(jobId) === 'null') {
      throw new Error('Valid Job Assignment ID is required to request OTP.');
    }
    clearApiCache();
    const res = await fetch(`${API_BASE}/field/jobs/${jobId}/request-otp`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify({ notes })
    });
    return handleResponse(res);
  },

  verifyFieldOtp: async (jobId, otpCode) => {
    if (!jobId || String(jobId) === 'undefined' || String(jobId) === 'null') {
      throw new Error('Valid Job Assignment ID is required to verify OTP.');
    }
    clearApiCache();
    const res = await fetch(`${API_BASE}/field/jobs/${jobId}/verify-otp`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify({ otp: otpCode, otp_code: otpCode })
    });
    return handleResponse(res);
  },

  completeFieldJob: async (jobId, resolutionNotes = '', customerSignatureConfirmed = true) => {
    if (!jobId || String(jobId) === 'undefined' || String(jobId) === 'null') {
      throw new Error('Valid Job Assignment ID is required to complete job.');
    }
    clearApiCache();
    const res = await fetch(`${API_BASE}/field/jobs/${jobId}/complete`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify({
        resolution_notes: resolutionNotes,
        customer_signature_confirmed: customerSignatureConfirmed
      })
    });
    return handleResponse(res);
  },

  getCustomerTracking: async (ticketId) => {
    return secureFetch(`${API_BASE}/field/tracking/${ticketId}`, { headers: getAuthHeaders() });
  },

  getFieldJobRoute: async (jobId) => {
    return secureFetch(`${API_BASE}/field/jobs/${jobId}/route`, { headers: getAuthHeaders() });
  },

  getFieldJobHistory: async (jobId) => {
    return cachedFetch(`${API_BASE}/field/jobs/${jobId}/tracking-history`, { headers: getAuthHeaders() }, true);
  },

  getFieldOpsStreamUrl: () => {
    const token = localStorage.getItem('pmrg_token');
    const market = localStorage.getItem('pmrg_market') || 'mumbai';
    return `${API_BASE}/field/stream?token=${encodeURIComponent(token || '')}&market_id=${encodeURIComponent(market)}&market=${encodeURIComponent(market)}`;
  },

  getCustomerTrackingStreamUrl: (sessionId) => {
    const token = localStorage.getItem('pmrg_token');
    return `${API_BASE}/field/tracking/${sessionId}/stream?token=${encodeURIComponent(token || '')}`;
  },

  getCustomerTicketStreamUrl: (ticketId) => {
    const token = localStorage.getItem('pmrg_token');
    const market = localStorage.getItem('pmrg_market') || 'mumbai';
    return `${API_BASE}/field/tickets/${ticketId}/stream?token=${encodeURIComponent(token || '')}&market_id=${encodeURIComponent(market)}`;
  },

  getTicketingStreamUrl: () => {
    const token = localStorage.getItem('pmrg_token');
    const market = localStorage.getItem('pmrg_market') || 'mumbai';
    return `${API_BASE}/field/stream?token=${encodeURIComponent(token || '')}&market_id=${encodeURIComponent(market)}&market=${encodeURIComponent(market)}`;
  },

  // Hierarchical RBAC API
  getPermissions: async () => {
    return cachedFetch(`${API_BASE}/rbac/permissions`, { headers: getAuthHeaders() }, true);
  },

  getRoles: async () => {
    return cachedFetch(`${API_BASE}/rbac/roles`, { headers: getAuthHeaders() }, true);
  },

  getAssignableRoles: async () => {
    return cachedFetch(`${API_BASE}/rbac/assignable-roles`, { headers: getAuthHeaders() }, true);
  },

  createCustomRole: async (roleData) => {
    clearApiCache();
    const res = await fetch(`${API_BASE}/rbac/roles`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify(roleData)
    });
    return handleResponse(res);
  },

  updateCustomRole: async (roleId, roleData) => {
    clearApiCache();
    const res = await fetch(`${API_BASE}/rbac/roles/${roleId}`, {
      method: 'PUT',
      headers: getAuthHeaders(),
      body: JSON.stringify(roleData)
    });
    return handleResponse(res);
  },

  deleteCustomRole: async (roleId) => {
    clearApiCache();
    const res = await fetch(`${API_BASE}/rbac/roles/${roleId}`, {
      method: 'DELETE',
      headers: getAuthHeaders()
    });
    return handleResponse(res);
  },

  assignUserRole: async (userId, roleName) => {
    clearApiCache();
    const res = await fetch(`${API_BASE}/rbac/users/${userId}/role`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify({ role_name: roleName })
    });
    return handleResponse(res);
  },

  // Engineer Workload & Capacity API
  getEngineerWorkload: async (engineerId) => {
    return cachedFetch(`${API_BASE}/field/engineers/${engineerId}/workload`, { headers: getAuthHeaders() }, true);
  },

  setEngineerCapacity: async (engineerId, maxCapacity) => {
    clearApiCache();
    const res = await fetch(`${API_BASE}/field/engineers/${engineerId}/capacity`, {
      method: 'PUT',
      headers: getAuthHeaders(),
      body: JSON.stringify({ max_capacity: maxCapacity })
    });
    return handleResponse(res);
  },

  // ── Phase 7B: Network Topology, OLT / ONT / ONU & Optical Health APIs ──────
  getNetworkOverview: async () => {
    return cachedFetch(`${API_BASE}/network/overview`, { headers: getAuthHeaders() }, true);
  },

  getNetworkDevices: async (params = {}) => {
    const query = new URLSearchParams(params).toString();
    const url = query ? `${API_BASE}/network/devices?${query}` : `${API_BASE}/network/devices`;
    return cachedFetch(url, { headers: getAuthHeaders() }, true);
  },

  getNetworkDevice: async (idOrCode) => {
    return cachedFetch(`${API_BASE}/network/devices/${idOrCode}`, { headers: getAuthHeaders() }, true);
  },

  getNetworkOlts: async () => {
    return cachedFetch(`${API_BASE}/network/olts`, { headers: getAuthHeaders() }, true);
  },

  getNetworkOltPorts: async (oltId) => {
    return cachedFetch(`${API_BASE}/network/olts/${oltId}/ports`, { headers: getAuthHeaders() }, true);
  },

  getNetworkCabinets: async () => {
    return cachedFetch(`${API_BASE}/network/cabinets`, { headers: getAuthHeaders() }, true);
  },

  getNetworkSplitters: async () => {
    return cachedFetch(`${API_BASE}/network/splitters`, { headers: getAuthHeaders() }, true);
  },

  getCustomerNetworkTopology: async (customerId) => {
    return cachedFetch(`${API_BASE}/network/topology/customer/${customerId}`, { headers: getAuthHeaders() }, true);
  },

  getDeviceNetworkTopology: async (deviceIdOrCode) => {
    return cachedFetch(`${API_BASE}/network/topology/device/${deviceIdOrCode}`, { headers: getAuthHeaders() }, true);
  },

  getDeviceHealth: async (deviceIdOrCode) => {
    return cachedFetch(`${API_BASE}/network/devices/${deviceIdOrCode}/health`, { headers: getAuthHeaders() }, true);
  },

  getDeviceImpact: async (deviceIdOrCode) => {
    return cachedFetch(`${API_BASE}/network/impact/${deviceIdOrCode}`, { headers: getAuthHeaders() }, true);
  },

  getNetworkAlarms: async (severity = null) => {
    const url = severity ? `${API_BASE}/network/alarms?severity=${severity}` : `${API_BASE}/network/alarms`;
    return cachedFetch(url, { headers: getAuthHeaders() }, true);
  },

  getNetworkMapLayers: async () => {
    return cachedFetch(`${API_BASE}/network/map-layers`, { headers: getAuthHeaders() }, true);
  },

  // ── Phase 8: System & Network Health Monitoring APIs ─────────────────────
  getMonitoringOverview: async () => {
    return cachedFetch(`${API_BASE}/network/monitoring/overview`, { headers: getAuthHeaders() }, true);
  },

  getMonitoringThresholds: async (deviceType = null) => {
    const url = deviceType 
      ? `${API_BASE}/network/monitoring/thresholds?device_type=${encodeURIComponent(deviceType)}`
      : `${API_BASE}/network/monitoring/thresholds`;
    return cachedFetch(url, { headers: getAuthHeaders() }, true);
  },

  updateMonitoringThreshold: async (thresholdId, warningThreshold, criticalThreshold) => {
    clearApiCache();
    const res = await fetch(`${API_BASE}/network/monitoring/thresholds/${thresholdId}`, {
      method: 'PUT',
      headers: getAuthHeaders(),
      body: JSON.stringify({
        warning_threshold: parseFloat(warningThreshold),
        critical_threshold: parseFloat(criticalThreshold)
      })
    });
    return handleResponse(res);
  },

  getMonitoringAlarms: async (severity = null, status = 'ACTIVE') => {
    let url = `${API_BASE}/network/monitoring/alarms?status=${encodeURIComponent(status)}`;
    if (severity) url += `&severity=${encodeURIComponent(severity)}`;
    return cachedFetch(url, { headers: getAuthHeaders() }, true);
  },

  getDeviceMetrics: async (deviceIdOrCode) => {
    return cachedFetch(`${API_BASE}/network/devices/${deviceIdOrCode}/metrics`, { headers: getAuthHeaders() }, true);
  },

  getDeviceMetricsHistory: async (deviceIdOrCode, timeRange = '1h', metricType = null) => {
    let url = `${API_BASE}/network/devices/${deviceIdOrCode}/metrics/history?time_range=${encodeURIComponent(timeRange)}`;
    if (metricType) url += `&metric_type=${encodeURIComponent(metricType)}`;
    return cachedFetch(url, { headers: getAuthHeaders() }, true);
  },

  simulateDeviceScenario: async (deviceIdOrCode, scenario) => {
    clearApiCache();
    const res = await fetch(`${API_BASE}/network/devices/${deviceIdOrCode}/simulate`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify({ scenario })
    });
    return handleResponse(res);
  },

  // Service Provisioning & Automated Service Delivery APIs
  getProvisioningPlans: async (accountType = null, billingType = null) => {
    let url = `${API_BASE}/provisioning/plans`;
    const params = [];
    if (accountType) params.push(`account_type=${encodeURIComponent(accountType)}`);
    if (billingType) params.push(`billing_type=${encodeURIComponent(billingType)}`);
    if (params.length > 0) url += `?${params.join('&')}`;
    return cachedFetch(url, { headers: getAuthHeaders() }, true);
  },

  getCustomerEligibility: async (customerId, planId) => {
    const url = `${API_BASE}/provisioning/customer/${customerId}/eligibility?plan_id=${encodeURIComponent(planId)}`;
    return cachedFetch(url, { headers: getAuthHeaders() }, true);
  },

  getProvisioningOrders: async (status = null, customerId = null, page = 1, pageSize = 50, sortOrder = 'desc') => {
    let url = `${API_BASE}/provisioning/orders?page=${page}&page_size=${pageSize}&sort_order=${sortOrder}`;
    if (status) url += `&status=${encodeURIComponent(status)}`;
    if (customerId) url += `&customer_id=${encodeURIComponent(customerId)}`;
    
    // We want the headers too for pagination (X-Total-Count, etc.)
    const res = await fetch(url, { headers: getAuthHeaders() });
    if (!res.ok) {
      const err = await res.json().catch(() => ({ detail: res.statusText }));
      throw new Error(err.detail || `HTTP Error ${res.status}`);
    }
    const data = await res.json();
    return {
      orders: data,
      totalCount: parseInt(res.headers.get('X-Total-Count') || (data.length || 0), 10),
      page: parseInt(res.headers.get('X-Page') || page, 10),
      pageSize: parseInt(res.headers.get('X-Page-Size') || pageSize, 10),
      totalPages: parseInt(res.headers.get('X-Total-Pages') || 1, 10),
    };
  },

  createProvisioningOrder: async (orderData) => {
    clearApiCache();
    const res = await fetch(`${API_BASE}/provisioning/orders`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify(orderData)
    });
    return handleResponse(res);
  },

  getProvisioningOrderDetail: async (idOrCode) => {
    return cachedFetch(`${API_BASE}/provisioning/orders/${idOrCode}`, { headers: getAuthHeaders() }, true);
  },

  approveProvisioningOrder: async (idOrCode, notes = null) => {
    clearApiCache();
    const res = await fetch(`${API_BASE}/provisioning/orders/${idOrCode}/approve`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify(notes ? { notes } : {})
    });
    return handleResponse(res);
  },

  triggerProvisioning: async (idOrCode) => {
    clearApiCache();
    const res = await fetch(`${API_BASE}/provisioning/orders/${idOrCode}/provision`, {
      method: 'POST',
      headers: getAuthHeaders()
    });
    return handleResponse(res);
  },

  retryProvisioning: async (idOrCode) => {
    clearApiCache();
    const res = await fetch(`${API_BASE}/provisioning/orders/${idOrCode}/retry`, {
      method: 'POST',
      headers: getAuthHeaders()
    });
    return handleResponse(res);
  },

  cancelProvisioningOrder: async (idOrCode, reason) => {
    clearApiCache();
    const res = await fetch(`${API_BASE}/provisioning/orders/${idOrCode}/cancel`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify({ reason })
    });
    return handleResponse(res);
  },

  reconcileProvisioningOrder: async (idOrCode) => {
    clearApiCache();
    const res = await fetch(`${API_BASE}/provisioning/orders/${idOrCode}/reconcile`, {
      method: 'POST',
      headers: getAuthHeaders()
    });
    return handleResponse(res);
  },

  // ─── Finance & Billing ───────────────────────────────────────────────────────
  getFinanceOverview: async (market = null) => {
    let url = `${API_BASE}/finance/overview`;
    if (market) url += `?market=${encodeURIComponent(market)}`;
    return cachedFetch(url, { headers: getAuthHeaders() }, true);
  },

  getGatewayStatus: async () => {
    return cachedFetch(`${API_BASE}/finance/gateway-status`, { headers: getAuthHeaders() }, true);
  },

  getBillingAccounts: async (market = null, status = null) => {
    let url = `${API_BASE}/finance/accounts?`;
    if (market) url += `market=${encodeURIComponent(market)}&`;
    if (status) url += `status=${encodeURIComponent(status)}&`;
    return cachedFetch(url, { headers: getAuthHeaders() }, true);
  },

  getBillingAccountDetail: async (accountId) => {
    return cachedFetch(`${API_BASE}/finance/accounts/${accountId}`, { headers: getAuthHeaders() }, true);
  },

  createBillingAccount: async (data) => {
    clearApiCache();
    const res = await fetch(`${API_BASE}/finance/accounts`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify(data)
    });
    return handleResponse(res);
  },

  getBillingSubscriptions: async (accountId = null, customerId = null, status = null) => {
    let url = `${API_BASE}/finance/subscriptions?`;
    if (accountId) url += `account_id=${encodeURIComponent(accountId)}&`;
    if (customerId) url += `customer_id=${encodeURIComponent(customerId)}&`;
    if (status) url += `status=${encodeURIComponent(status)}&`;
    return cachedFetch(url, { headers: getAuthHeaders() }, true);
  },

  createBillingSubscription: async (data) => {
    clearApiCache();
    const res = await fetch(`${API_BASE}/finance/subscriptions`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify(data)
    });
    return handleResponse(res);
  },

  transitionSubscription: async (subscriptionId, action, reason = null) => {
    clearApiCache();
    const res = await fetch(`${API_BASE}/finance/subscriptions/${subscriptionId}/transition`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify({ action, reason })
    });
    return handleResponse(res);
  },

  getFinanceInvoices: async (market = null, status = null, customerId = null) => {
    let url = `${API_BASE}/finance/invoices?`;
    if (market) url += `market=${encodeURIComponent(market)}&`;
    if (status) url += `status=${encodeURIComponent(status)}&`;
    if (customerId) url += `customer_id=${encodeURIComponent(customerId)}&`;
    return cachedFetch(url, { headers: getAuthHeaders() }, true);
  },

  getFinanceInvoiceDetail: async (invoiceId) => {
    return cachedFetch(`${API_BASE}/finance/invoices/${invoiceId}`, { headers: getAuthHeaders() }, true);
  },

  issueInvoice: async (data) => {
    clearApiCache();
    const res = await fetch(`${API_BASE}/finance/invoices/issue`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify(data)
    });
    return handleResponse(res);
  },

  downloadInvoice: async (invoiceId) => {
    return cachedFetch(`${API_BASE}/finance/invoices/${invoiceId}/download`, { headers: getAuthHeaders() }, true);
  },

  getFinancePayments: async (market = null, customerId = null) => {
    let url = `${API_BASE}/finance/payments?`;
    if (market) url += `market=${encodeURIComponent(market)}&`;
    if (customerId) url += `customer_id=${encodeURIComponent(customerId)}&`;
    return cachedFetch(url, { headers: getAuthHeaders() }, true);
  },

  recordPayment: async (data) => {
    clearApiCache();
    const res = await fetch(`${API_BASE}/finance/payments`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify(data)
    });
    return handleResponse(res);
  },

  getCreditNotes: async (market = null, customerId = null) => {
    let url = `${API_BASE}/finance/credit-notes?`;
    if (market) url += `market=${encodeURIComponent(market)}&`;
    if (customerId) url += `customer_id=${encodeURIComponent(customerId)}&`;
    return cachedFetch(url, { headers: getAuthHeaders() }, true);
  },

  issueCreditNote: async (data) => {
    clearApiCache();
    const res = await fetch(`${API_BASE}/finance/credit-notes`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify(data)
    });
    return handleResponse(res);
  },

  getRefunds: async (market = null) => {
    let url = `${API_BASE}/finance/refunds?`;
    if (market) url += `market=${encodeURIComponent(market)}&`;
    return cachedFetch(url, { headers: getAuthHeaders() }, true);
  },

  issueRefund: async (data) => {
    clearApiCache();
    const res = await fetch(`${API_BASE}/finance/refunds`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify(data)
    });
    return handleResponse(res);
  },

  getLedgerEntries: async (market = null, limit = 50) => {
    let url = `${API_BASE}/finance/ledger/entries?limit=${limit}&`;
    if (market) url += `market=${encodeURIComponent(market)}&`;
    return cachedFetch(url, { headers: getAuthHeaders() }, true);
  },

  getLedgerBalances: async (market = null) => {
    let url = `${API_BASE}/finance/ledger/balances?`;
    if (market) url += `market=${encodeURIComponent(market)}&`;
    return cachedFetch(url, { headers: getAuthHeaders() }, true);
  },

  verifyLedger: async (market = null) => {
    let url = `${API_BASE}/finance/ledger/verify?`;
    if (market) url += `market=${encodeURIComponent(market)}&`;
    return cachedFetch(url, { headers: getAuthHeaders() }, true);
  },

  reverseLedgerEntry: async (entryId, reason) => {
    clearApiCache();
    const res = await fetch(`${API_BASE}/finance/ledger/entries/${entryId}/reverse`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify({ reason })
    });
    return handleResponse(res);
  },

  redeemVoucher: async (data) => {
    clearApiCache();
    const res = await fetch(`${API_BASE}/finance/vouchers/redeem`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify(data)
    });
    return handleResponse(res);
  },

  getVoucherRedemptions: async (customerId = null) => {
    let url = `${API_BASE}/finance/vouchers/redemptions?`;
    if (customerId) url += `customer_id=${encodeURIComponent(customerId)}&`;
    return cachedFetch(url, { headers: getAuthHeaders() }, true);
  },

  runBillingJob: async (data = {}) => {
    clearApiCache();
    const res = await fetch(`${API_BASE}/finance/jobs/billing-run`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify(data)
    });
    return handleResponse(res);
  },

  runDunningJob: async (data = {}) => {
    clearApiCache();
    const res = await fetch(`${API_BASE}/finance/jobs/overdue-dunning`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify(data)
    });
    return handleResponse(res);
  },

  // Customer Self-Service Billing & Online Payment Order
  createPaymentOrder: async (data) => {
    clearApiCache();
    const res = await fetch(`${API_BASE}/finance/payments/create-order`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify(data)
    });
    return handleResponse(res);
  },

  getMyBillingSummary: async () => {
    return cachedFetch(`${API_BASE}/finance/my-billing`, { headers: getAuthHeaders() }, true);
  },

  downloadInvoicePdf: async (invoiceId) => {
    const res = await fetch(`${API_BASE}/finance/invoices/${invoiceId}/download?format=pdf`, {
      headers: getAuthHeaders()
    });
    if (!res.ok) {
      throw new Error(`Failed to download invoice PDF (Status: ${res.status})`);
    }
    return res.blob();
  },

  getStorageStatus: async () => {
    return cachedFetch(`${API_BASE}/finance/storage-status`, { headers: getAuthHeaders() }, true);
  }
};



