const API_BASE = import.meta.env.API_URL || 'https://mso.isp.backend.pmrgsolution.com/api';

// In-memory cache for ultra-fast tab switches and responsive UI
const requestCache = new Map();
const CACHE_TTL_MS = 20000; // 20 seconds cache TTL

function getAuthHeaders() {
  const token = localStorage.getItem('jeebr_token');
  return {
    'Content-Type': 'application/json',
    ...(token ? { 'Authorization': `Bearer ${token}` } : {})
  };
}

async function handleResponse(res) {
  if (res.status === 401) {
    localStorage.removeItem('jeebr_token');
    localStorage.removeItem('jeebr_user');
    window.dispatchEvent(new Event('auth-logout'));
  }
  if (!res.ok) {
    const errorData = await res.json().catch(() => ({}));
    throw new Error(errorData.detail || `Request failed with status ${res.status}`);
  }
  return res.json();
}

async function cachedFetch(url, options = {}, forceRefresh = false) {
  const cacheKey = url;
  const now = Date.now();
  
  if (!forceRefresh && requestCache.has(cacheKey)) {
    const cached = requestCache.get(cacheKey);
    if (now - cached.timestamp < CACHE_TTL_MS) {
      return cached.data;
    }
  }

  const res = await fetch(url, options);
  const data = await handleResponse(res);
  requestCache.set(cacheKey, { timestamp: now, data });
  return data;
}

export function clearApiCache() {
  requestCache.clear();
}

export const api = {
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

  getAtRiskCustomers: async (minScore = 30, forceRefresh = false) => {
    return cachedFetch(`${API_BASE}/churn/at-risk?min_score=${minScore}`, { headers: getAuthHeaders() }, forceRefresh);
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

  getJourneyNBAs: async (forceRefresh = false) => {
    return cachedFetch(`${API_BASE}/journeys/next-best-actions`, { headers: getAuthHeaders() }, forceRefresh);
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

  getPilotBundleScenario: async (nodeCode = 'OLT-BND-01', forceRefresh = false) => {
    return cachedFetch(`${API_BASE}/pilot-bundle/scenario?node_code=${encodeURIComponent(nodeCode)}`, { headers: getAuthHeaders() }, forceRefresh);
  },

  getOrchestrationQueue: async (forceRefresh = false) => {
    return cachedFetch(`${API_BASE}/orchestration/queue`, { headers: getAuthHeaders() }, forceRefresh);
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

  getRevenueLeakages: async (forceRefresh = false) => {
    return cachedFetch(`${API_BASE}/revenue/leakages`, { headers: getAuthHeaders() }, forceRefresh);
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

  getCustomers: async (search = '', locality = '', segment = '', forceRefresh = false) => {
    let url = `${API_BASE}/customers?limit=60&`;
    if (search) url += `search=${encodeURIComponent(search)}&`;
    if (locality) url += `locality=${encodeURIComponent(locality)}&`;
    if (segment) url += `segment=${encodeURIComponent(segment)}&`;
    return cachedFetch(url, { headers: getAuthHeaders() }, forceRefresh);
  },

  getCustomer360: async (customerId, forceRefresh = false) => {
    return cachedFetch(`${API_BASE}/customers/${customerId}/360`, { headers: getAuthHeaders() }, forceRefresh);
  }
};

