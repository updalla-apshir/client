export const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL!;

class ApiClient {
  private baseURL: string;

  constructor(baseURL: string = API_BASE_URL) {
    this.baseURL = baseURL;
  }

   private async request<T>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<T> {
    const url = `${this.baseURL}${endpoint}`;

    let token: string | null = null;

    if (typeof window !== 'undefined') {
      token = localStorage.getItem('token');

      if (!token) {
        window.location.href = '/login';
        throw new Error('No authentication token - redirecting to login');
      }

      // Server handles token validation; no client-side expiration check
    }

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 15000);

    const config: RequestInit = {
      headers: {
        'Content-Type': 'application/json',
        ...(token ? { 'Authorization': `Bearer ${token}` } : {}),
        ...options.headers,
      },
      signal: controller.signal,
      ...options,
    };

    if (options.body) {
      console.log('Request URL:', url);
      console.log('Request Body:', options.body);
    }

    try {
      const response = await fetch(url, config);

      clearTimeout(timeoutId);

      if (response.status === 401) {
        localStorage.removeItem('token');
        if (typeof window !== 'undefined') {
          window.location.href = '/login';
        }
        throw new Error('Unauthorized - redirecting to login');
      }

      if (!response.ok) {
        let errorMessage = response.statusText || `Request failed (${response.status})`;
        try {
          const text = await response.text();
          const errorData = text ? JSON.parse(text) : {};
          if (errorData.error) {
            if (typeof errorData.error === 'string') {
              errorMessage = errorData.error;
            } else {
              if (errorData.error.message) errorMessage = errorData.error.message;
              if (errorData.error.details && Array.isArray(errorData.error.details)) {
                const detailMessages = errorData.error.details.map(
                  (d: any) => d.field ? `${d.field}: ${d.message}` : d.message,
                );
                errorMessage = detailMessages.join('; ');
              }
            }
          } else if (errorData.message) {
            errorMessage = errorData.message;
          }
        } catch (parseError) {
          console.error('Could not parse error response');
        }
        throw new Error(errorMessage);
      }

      return await response.json();
    } catch (error) {
      clearTimeout(timeoutId);
      // Only clear token on actual 401 from server, not on network errors
      if (error instanceof Error && error.message.includes('Unauthorized')) {
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        if (typeof window !== 'undefined') {
          window.location.href = '/login';
        }
      }
      throw error;
    }
  }

  // Generic CRUD methods
  async get<T>(endpoint: string): Promise<T> {
    return this.request<T>(endpoint, { method: 'GET' });
  }

  async post<T>(endpoint: string, data?: any): Promise<T> {
    try {
      return await this.request<T>(endpoint, {
        method: 'POST',
        body: JSON.stringify(data),
      });
    } catch (error) {
      throw error;
    }
  }

  async put<T>(endpoint: string, data?: any): Promise<T> {
    return this.request<T>(endpoint, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  }

  async patch<T>(endpoint: string, data?: any): Promise<T> {
    const startTime = Date.now();
    try {
      const result = await this.request<T>(endpoint, {
        method: 'PATCH',
        body: JSON.stringify(data),
      });
      const endTime = Date.now();
      console.log(`PATCH ${endpoint} took ${endTime - startTime}ms`);
      return result;
    } catch (error) {
      const endTime = Date.now();
      console.error(`PATCH ${endpoint} failed after ${endTime - startTime}ms:`, error);
      throw error;
    }
  }

  async delete<T>(endpoint: string): Promise<T> {
    return this.request<T>(endpoint, { method: 'DELETE' });
  }

  // Specific entity methods
  getProperties = async (): Promise<any[]> => {
    const startTime = Date.now();
    try {
      const response = await this.get('/properties');
      const endTime = Date.now();
      console.log(`Properties fetch took ${endTime - startTime}ms`);
      return (response as any).data || response; // Handle both paginated and direct responses
    } catch (error) {
      const endTime = Date.now();
      console.error(`Properties fetch failed after ${endTime - startTime}ms:`, error);
      throw error;
    }
  }

  getBuildings = async (): Promise<any[]> => {
    const response = await this.get('/buildings');
    return (response as any).data || response; // Handle both paginated and direct responses
  }

  getUnits = async (): Promise<any[]> => {
    const response = await this.get('/units');
    return (response as any).data || response; // Handle both paginated and direct responses
  }

  getTenants = async (): Promise<any[]> => {
    const response = await this.get('/tenants');
    return (response as any).data || response; // Handle both paginated and direct responses
  }

  getLeases = async (): Promise<any[]> => {
    const response = await this.get('/leases?limit=100');
    return (response as any).data || response;
  }

  searchLeases = async (search: string, page = 1, limit = 20): Promise<any> => {
    const params = new URLSearchParams({ page: String(page), limit: String(limit) });
    if (search) params.set('search', search);
    return this.get(`/leases?${params.toString()}`);
  }

  getInvoices = async (): Promise<any[]> => {
    const response = await this.get('/invoices');
    return (response as any).data || response; // Handle both paginated and direct responses
  }

  getPayments = async (): Promise<any[]> => {
    const response = await this.get('/payments');
    return (response as any).data || response; // Handle both paginated and direct responses
  }

  getAccounts = async (): Promise<any[]> => {
    const response = await this.get('/accounts');
    return (response as any).data || response;
  }

  getReceipts = async (): Promise<any[]> => {
    const response = await this.get('/receipts');
    return (response as any).data || response;
  }

  getParkingSpaces = async (): Promise<any[]> => {
    const response = await this.get('/parking-spaces');
    return (response as any).data || response;
  }

  getServiceCharges = async (): Promise<any[]> => {
    const response = await this.get('/service-charges');
    return (response as any).data || response;
  }

  getUsers = async (): Promise<any[]> => {
    const response = await this.get('/users');
    return (response as any).data || response; // Handle both paginated and direct responses
  }

  getAuditLogs = async (): Promise<any[]> => {
    const response = await this.get('/audit-logs');
    return (response as any).data || response;
  }

  getLeaseHistory = async (): Promise<any[]> => {
    const response = await this.get('/lease-status-history');
    return (response as any).data || response;
  }

  getInvoiceItems = async (invoiceId: number): Promise<any[]> => {
    const response = await this.get(`/invoice-items/invoice/${invoiceId}`);
    return (response as any).data || response;
  }

  getDashboardStats = async (): Promise<any> => {
    return this.get('/dashboard/stats');
  }

  getTenantDebts = async (): Promise<any[]> => {
    const response = await this.get('/tenants/debts');
    return (response as any).data || response;
  }

  getTenantDebt = async (tenantId: number): Promise<any> => {
    return this.get(`/tenants/${tenantId}/debt`);
  }

  getDashboardMonthlyRevenue = async (): Promise<any[]> => {
    return this.get('/dashboard/revenue');
  }

  getDashboardRecentPayments = async (limit = 10): Promise<any[]> => {
    return this.get(`/dashboard/recent-payments?limit=${limit}`);
  }

  getDashboardRecentActivity = async (limit = 10): Promise<any[]> => {
    return this.get(`/dashboard/recent-activity?limit=${limit}`);
  }

  getDashboardExpiringLeases = async (days = 30): Promise<any[]> => {
    return this.get(`/dashboard/expiring-leases?days=${days}`);
  }

  getDashboardInvoiceStatus = async (): Promise<any> => {
    return this.get('/dashboard/invoice-status');
  }

  // Profile
  getProfile = async (): Promise<any> => {
    const response = await this.get('/profile');
    return (response as any).data || response;
  }

  updateProfile = async (data: any): Promise<any> => {
    const response = await this.patch('/profile', data);
    return (response as any).data || response;
  }

  changePassword = async (data: any): Promise<any> => {
    const response = await this.patch('/profile/password', data);
    return (response as any).data || response;
  }
}

export const apiClient = new ApiClient();