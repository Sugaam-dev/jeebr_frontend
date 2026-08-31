const API_BASE = 'http://localhost:8000/api';

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

export const api = {
  login: async (email, password) => {
    const res = await fetch(`${API_BASE}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password })
    });
    return handleResponse(res);
  },

  demoLogin: async (role) => {
    const res = await fetch(`${API_BASE}/auth/demo-login/${role}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' }
    });
    return handleResponse(res);
  },

  getCockpitSummary: async () => {
    const res = await fetch(`${API_BASE}/cockpit/summary`, {
      headers: getAuthHeaders()
    });
    return handleResponse(res);
  },

  getNodePredictions: async () => {
    const res = await fetch(`${API_BASE}/assurance/predictions`, {
      headers: getAuthHeaders()
    });
    return handleResponse(res);
  },

  proposeAssuranceDispatch: async (nodeId, actionType, customNotes) => {
    const res = await fetch(`${API_BASE}/assurance/recommend`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify({ node_id: nodeId, action_type: actionType, custom_notes: customNotes })
    });
    return handleResponse(res);
  },

  getAtRiskCustomers: async (minScore = 30) => {
    const res = await fetch(`${API_BASE}/churn/at-risk?min_score=${minScore}`, {
      headers: getAuthHeaders()
    });
    return handleResponse(res);
  },

  proposeRetentionAction: async (customerId, actionType, customNotes) => {
    const res = await fetch(`${API_BASE}/churn/recommend`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify({ customer_id: customerId, action_type: actionType, custom_notes: customNotes })
    });
    return handleResponse(res);
  },

  getJourneyNBAs: async () => {
    const res = await fetch(`${API_BASE}/journeys/next-best-actions`, {
      headers: getAuthHeaders()
    });
    return handleResponse(res);
  },

  proposeJourneyAction: async (customerId, actionType) => {
    const res = await fetch(`${API_BASE}/journeys/recommend`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify({ customer_id: customerId, action_type: actionType })
    });
    return handleResponse(res);
  },

  getOrchestrationQueue: async () => {
    const res = await fetch(`${API_BASE}/orchestration/queue`, {
      headers: getAuthHeaders()
    });
    return handleResponse(res);
  },

  proposeOrchestration: async (ticketId, workflowAction) => {
    const res = await fetch(`${API_BASE}/orchestration/recommend`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify({ ticket_id: ticketId, workflow_action: workflowAction })
    });
    return handleResponse(res);
  },

  getRevenueLeakages: async () => {
    const res = await fetch(`${API_BASE}/revenue/leakages`, {
      headers: getAuthHeaders()
    });
    return handleResponse(res);
  },

  proposeRevenueRemediation: async (invoiceId, remediationAction) => {
    const res = await fetch(`${API_BASE}/revenue/recommend`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify({ invoice_id: invoiceId, remediation_action: remediationAction })
    });
    return handleResponse(res);
  },

  getRecommendations: async (status, sourceModule) => {
    let url = `${API_BASE}/governance/recommendations?`;
    if (status) url += `status=${encodeURIComponent(status)}&`;
    if (sourceModule) url += `source_module=${encodeURIComponent(sourceModule)}&`;
    const res = await fetch(url, { headers: getAuthHeaders() });
    return handleResponse(res);
  },

  approveRecommendation: async (recommendationId, notes) => {
    const res = await fetch(`${API_BASE}/governance/approve`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify({ recommendation_id: recommendationId, notes })
    });
    return handleResponse(res);
  },

  rejectRecommendation: async (recommendationId, notes) => {
    const res = await fetch(`${API_BASE}/governance/reject`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify({ recommendation_id: recommendationId, notes })
    });
    return handleResponse(res);
  },

  getAuditTrail: async (sourceModule, decision) => {
    let url = `${API_BASE}/governance/audit-trail?limit=100&`;
    if (sourceModule) url += `source_module=${encodeURIComponent(sourceModule)}&`;
    if (decision) url += `decision=${encodeURIComponent(decision)}&`;
    const res = await fetch(url, { headers: getAuthHeaders() });
    return handleResponse(res);
  },

  getCustomers: async (search = '', locality = '', segment = '') => {
    let url = `${API_BASE}/customers?limit=60&`;
    if (search) url += `search=${encodeURIComponent(search)}&`;
    if (locality) url += `locality=${encodeURIComponent(locality)}&`;
    if (segment) url += `segment=${encodeURIComponent(segment)}&`;
    const res = await fetch(url, { headers: getAuthHeaders() });
    return handleResponse(res);
  },

  getCustomer360: async (customerId) => {
    const res = await fetch(`${API_BASE}/customers/${customerId}/360`, {
      headers: getAuthHeaders()
    });
    return handleResponse(res);
  }
};
