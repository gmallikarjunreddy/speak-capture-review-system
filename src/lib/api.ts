
const API_BASE_URL = 'http://localhost:3001/api';

class ApiClient {
  private token: string | null = null;

  constructor() {
    this.token = localStorage.getItem('auth_token');
  }

  setToken(token: string) {
    this.token = token;
    localStorage.setItem('auth_token', token);
  }

  clearToken() {
    this.token = null;
    localStorage.removeItem('auth_token');
  }

  private async request(endpoint: string, options: RequestInit = {}) {
    const url = `${API_BASE_URL}${endpoint}`;
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      ...options.headers as Record<string, string>,
    };

    if (this.token) {
      headers.Authorization = `Bearer ${this.token}`;
    }

    const response = await fetch(url, {
      ...options,
      headers,
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({ error: 'Network error' }));
      throw new Error(error.error || 'Request failed');
    }

    return response.json();
  }

  // Auth methods
  async signUp(email: string, password: string, userData?: any) {
    const response = await this.request('/auth/signup', {
      method: 'POST',
      body: JSON.stringify({ email, password, ...userData }),
    });
    
    if (response.token) {
      this.setToken(response.token);
    }
    
    return { data: response, error: null };
  }

  async signIn(email: string, password: string) {
    try {
      const response = await this.request('/auth/signin', {
        method: 'POST',
        body: JSON.stringify({ email, password }),
      });
      
      if (response.token) {
        this.setToken(response.token);
      }
      
      return { data: response, error: null };
    } catch (error) {
      return { data: null, error };
    }
  }

  async signOut() {
    this.clearToken();
    return { error: null };
  }

  // Profile methods
  async getProfile() {
    return this.request('/profile');
  }

  async updateProfile(data: any) {
    return this.request('/profile', {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  }

  // Sentences methods
  async getSentences() {
    return this.request('/sentences');
  }

  // Recording sessions methods
  async createRecordingSession(totalSentences: number) {
    return this.request('/recording-sessions', {
      method: 'POST',
      body: JSON.stringify({ total_sentences: totalSentences }),
    });
  }

  async updateRecordingSession(id: string, data: any) {
    return this.request(`/recording-sessions/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  }

  // Recordings methods
  async uploadRecording(audioBlob: Blob, sentenceId: string, status: string, attemptNumber: number) {
    const formData = new FormData();
    formData.append('audio', audioBlob, 'recording.webm');
    formData.append('sentence_id', sentenceId);
    formData.append('status', status);
    formData.append('attempt_number', attemptNumber.toString());

    const url = `${API_BASE_URL}/recordings`;
    const headers: Record<string, string> = {};

    if (this.token) {
      headers.Authorization = `Bearer ${this.token}`;
    }

    const response = await fetch(url, {
      method: 'POST',
      headers,
      body: formData,
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({ error: 'Upload failed' }));
      throw new Error(error.error || 'Upload failed');
    }

    return response.json();
  }

  // Admin methods
  async adminSignIn(username: string, password: string) {
    try {
      const response = await this.request('/admin/auth', {
        method: 'POST',
        body: JSON.stringify({ username, password }),
      });
      
      if (response.token) {
        this.setToken(response.token);
      }
      
      return { data: response, error: null };
    } catch (error) {
      return { data: null, error };
    }
  }

  async getAdminSentences() {
    return this.request('/admin/sentences');
  }

  async getAdminUsers() {
    return this.request('/admin/users');
  }

  async getAdminRecordings() {
    return this.request('/admin/recordings');
  }
}

export const apiClient = new ApiClient();
