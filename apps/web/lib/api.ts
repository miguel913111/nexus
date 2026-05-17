'use client';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000/v1';

function getApiKey(): string | null {
  if (typeof window !== 'undefined') {
    return localStorage.getItem('nexus_api_key');
  }
  return null;
}

export async function apiFetch(path: string, options: RequestInit = {}) {
  const apiKey = getApiKey();
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(apiKey ? { 'X-API-Key': apiKey } : {}),
    ...(options.headers as Record<string, string> || {}),
  };

  const res = await fetch(`${API_URL}${path}`, {
    ...options,
    headers,
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({ error: 'Erro desconhecido' }));
    throw new Error(err.error || `HTTP ${res.status}`);
  }

  return res.json();
}

export async function chatCompletion(messages: any[], stream = false) {
  return apiFetch('/chat/completions', {
    method: 'POST',
    body: JSON.stringify({ messages, maxTokens: 4096, stream }),
  });
}

export async function getStatus() {
  return apiFetch('/chat/status');
}

export async function getPlans() {
  return apiFetch('/billing/plans');
}

export async function getInvoices() {
  return apiFetch('/invoices');
}

export async function getInvoice(id: string) {
  return apiFetch(`/invoices/${id}`);
}

export async function downloadInvoice(id: string) {
  const apiKey = getApiKey();
  const res = await fetch(`${API_URL}/invoices/${id}/download`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      ...(apiKey ? { 'X-API-Key': apiKey } : {}),
    },
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({ error: 'Erro desconhecido' }));
    throw new Error(err.error || `HTTP ${res.status}`);
  }
  const blob = await res.blob();
  const url = window.URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `fatura-${id}.html`;
  document.body.appendChild(a);
  a.click();
  a.remove();
  window.URL.revokeObjectURL(url);
}
