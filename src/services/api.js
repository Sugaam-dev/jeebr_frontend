const API_BASE = import.meta.env.VITE_API_URL || (
  typeof window !== 'undefined' && (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1')
    ? 'http://localhost:8000/api'
    : 'https://mso.isp.backend.pmrgsolution.com/api'
);

// In-memory cache for ultra-fast tab switches and responsive UI
const requestCache = new Map();
const inflightRequests = new Map();
const CACHE_TTL_MS = 45000; // 45 seconds cache TTL

function getAuthHeaders() {
  const token = localStorage.getItem('pmrg_token');
  const market = localStorage.getItem('pmrg_market') || 'mumbai';
  return {
    'Content-Type': 'application/json',
    'X-Market-Id': market,
    ...(token ? { 'Authorization': `Bearer ${token}` } : {})
  };
}

async function handleResponse(res) {
  if (res.status === 401) {
    localStorage.removeItem('pmrg_token');
    localStorage.removeItem('pmrg_user');
    window.dispatchEvent(new Event('auth-logout'));
  }
  if (!res.ok) {
    const errorData = await res.json().catch(() => ({}));
    throw new Error(errorData.detail || `Request failed with status ${res.status}`);
  }
  return res.json();
}

async function cachedFetch(url, options = {}, forceRefresh = false) {
  const market = localStorage.getItem('pmrg_market') || 'mumbai';
  const cacheKey = `${url}::market=${market}`;
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
      const res = await fetch(url, options);
      const data = await handleResponse(res);
      requestCache.set(cacheKey, { timestamp: Date.now(), data });
      return data;
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
    const res = await fetch(`${API_BASE}/auth/signup`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ full_name: fullName, email, password, role })
    });
    return handleResponse(res);
  },

  login: async (email, password) => {
    clearApiCache();
    const res = await fetch(`${API_BASE}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password })
    });
    return handleResponse(res);
  },

  getUsers: async () => {
    return cachedFetch(`${API_BASE}/auth/users`, { headers: getAuthHeaders() }, true);
  },

  demoLogin: async (role) => {
    clearApiCache();
    const res = await fetch(`${API_BASE}/auth/demo-login/${role}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' }
    });
    return handleResponse(res);
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
  }
};

