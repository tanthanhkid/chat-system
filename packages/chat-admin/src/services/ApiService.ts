const SERVER_URL = 'http://localhost:3001';

class ApiService {
  private getAuthHeaders(): HeadersInit {
    const token = localStorage.getItem('admin_token');
    return {
      'Content-Type': 'application/json',
      ...(token && { 'Authorization': `Bearer ${token}` })
    };
  }

  private async handleResponse(response: Response) {
    if (response.status === 401) {
      // Token expired or invalid, redirect to login
      localStorage.removeItem('admin_token');
      window.location.reload();
      throw new Error('Authentication required');
    }
    
    if (!response.ok) {
      const error = await response.json().catch(() => ({ error: 'Unknown error' }));
      throw new Error(error.error || `HTTP ${response.status}`);
    }
    
    return response.json();
  }

  async fetchConversations() {
    const response = await fetch(`${SERVER_URL}/api/conversations`, {
      headers: this.getAuthHeaders()
    });
    return this.handleResponse(response);
  }

  async fetchMessages(conversationId: string, offset: number = 0, limit: number = 10, direction: 'asc' | 'desc' = 'desc') {
    const params = new URLSearchParams({
      offset: offset.toString(),
      limit: limit.toString(),
      direction
    });
    
    const response = await fetch(`${SERVER_URL}/api/conversations/${conversationId}/messages?${params}`, {
      headers: this.getAuthHeaders()
    });
    return this.handleResponse(response);
  }

  async markMessageAsRead(messageId: string) {
    const response = await fetch(`${SERVER_URL}/api/messages/${messageId}/read`, {
      method: 'POST',
      headers: this.getAuthHeaders()
    });
    return this.handleResponse(response);
  }

  async markConversationAsRead(conversationId: string) {
    const response = await fetch(`${SERVER_URL}/api/conversations/${conversationId}/read`, {
      method: 'POST',
      headers: this.getAuthHeaders()
    });
    return this.handleResponse(response);
  }

  async subscribeToPushNotifications(subscription: any) {
    const response = await fetch(`${SERVER_URL}/api/admin/push/subscribe`, {
      method: 'POST',
      headers: this.getAuthHeaders(),
      body: JSON.stringify({ subscription })
    });
    return this.handleResponse(response);
  }

  async testPushNotification() {
    const response = await fetch(`${SERVER_URL}/api/admin/test-push`, {
      method: 'POST',
      headers: this.getAuthHeaders()
    });
    return this.handleResponse(response);
  }
}

export const apiService = new ApiService();