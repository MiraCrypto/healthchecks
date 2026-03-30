import { Check, Ping, User, LoginDTO, UpdateProfileDTO, ChangePasswordDTO, AdminCreateUserDTO, AdminUpdateRoleDTO, CreateCheckDTO, UpdateCheckDTO } from '@healthchecks/shared';

const API_BASE = '/api';

async function fetchApi<T>(endpoint: string, options?: RequestInit): Promise<T> {
  const response = await fetch(`${API_BASE}${endpoint}`, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...options?.headers,
    },
    credentials: 'include',
  });

  if (!response.ok) {
    let errorMessage = 'An error occurred';
    try {
      const data = await response.json();
      if (data.error) {
        errorMessage = typeof data.error === 'string' ? data.error : JSON.stringify(data.error);
      }
    } catch {
      errorMessage = response.statusText || 'An error occurred';
    }
    throw new Error(errorMessage);
  }

  // Handle empty responses (like 204 No Content) or endpoints that return text instead of JSON sometimes (though our API mostly returns JSON)
  const text = await response.text();
  if (!text) {
    return null as T;
  }

  try {
    return JSON.parse(text);
  } catch {
    return text as unknown as T;
  }
}

export class ApiClient {
  // Auth
  static async login(data: LoginDTO): Promise<{ message: string }> {
    return fetchApi<{ message: string }>('/auth/login', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  static async register(data: LoginDTO): Promise<{ message: string, user: { id: string, username: string } }> {
    return fetchApi<{ message: string, user: { id: string, username: string } }>('/auth/register', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  static async logout(): Promise<{ message: string }> {
    return fetchApi<{ message: string }>('/auth/logout', {
      method: 'POST',
    });
  }

  static async getMe(): Promise<User> {
    return fetchApi<User>('/auth/me');
  }

  // Users & Profile
  static async updateProfile(data: UpdateProfileDTO): Promise<{ message: string }> {
    return fetchApi<{ message: string }>('/users/me', {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  }

  static async changePassword(data: ChangePasswordDTO): Promise<{ message: string }> {
    return fetchApi<{ message: string }>('/users/me/password', {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  }

  static async getPublicProfile(username: string): Promise<Pick<User, 'username' | 'displayName' | 'description' | 'createdAt'>> {
    return fetchApi<Pick<User, 'username' | 'displayName' | 'description' | 'createdAt'>>(`/users/${username}`);
  }

  // Admin
  static async getUsers(): Promise<User[]> {
    return fetchApi<User[]>('/users');
  }

  static async createUser(data: AdminCreateUserDTO): Promise<{ message: string, user: User }> {
    return fetchApi<{ message: string, user: User }>('/users', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  static async updateUserRole(id: string, data: AdminUpdateRoleDTO): Promise<{ message: string }> {
    return fetchApi<{ message: string }>(`/users/${id}/role`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  }

  // Checks
  static async getChecks(): Promise<Check[]> {
    return fetchApi<Check[]>('/checks');
  }

  static async getCheck(id: string): Promise<Check> {
    return fetchApi<Check>(`/checks/${id}`);
  }

  static async createCheck(data: CreateCheckDTO): Promise<Check> {
    return fetchApi<Check>('/checks', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  static async updateCheck(id: string, data: UpdateCheckDTO): Promise<Check> {
    return fetchApi<Check>(`/checks/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  }

  static async deleteCheck(id: string): Promise<{ success: boolean }> {
    return fetchApi<{ success: boolean }>(`/checks/${id}`, {
      method: 'DELETE',
    });
  }

  static async getCheckPings(checkId: string): Promise<Ping[]> {
    return fetchApi<Ping[]>(`/checks/${checkId}/pings`);
  }

  // Payloads
  static async getPayloadText(pingId: string): Promise<{ text: string, contentType: string }> {
    const response = await fetch(`/payload/${pingId}`, {
      method: 'GET',
    });

    if (!response.ok) {
      let errorMessage = 'An error occurred';
      try {
        const text = await response.text();
        if (text) errorMessage = text;
      } catch {
        errorMessage = response.statusText || 'An error occurred';
      }
      throw new Error(errorMessage);
    }

    const contentType = response.headers.get('Content-Type') || 'application/octet-stream';
    const text = await response.text();
    return { text, contentType };
  }
}
