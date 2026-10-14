import { Product } from '../types/product';
import type { AuthResponse, LoginInput, RegisterInput } from '../types/auth';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000';

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  const response = await fetch(`${API_URL}${path}`, init);
  const body: unknown = await response.json().catch(() => null);

  if (!response.ok) {
    const message =
      typeof body === 'object' && body !== null && 'message' in body
        ? (body as { message?: string | string[] }).message
        : undefined;
    throw new Error(Array.isArray(message) ? message.join(', ') : message || 'Yêu cầu thất bại');
  }

  return body as T;
}

export async function getProducts(signal?: AbortSignal): Promise<Product[]> {
  return request<Product[]>('/products', { signal });
}

/**
 * Lấy chi tiết sản phẩm theo ID
 * Gọi API backend NestJS: GET /products/:id
 */
export async function getProductById(id: string | number): Promise<Product> {
  return request<Product>(`/products/${encodeURIComponent(String(id))}`);
}

export function registerUser(input: RegisterInput): Promise<AuthResponse> {
  return request<AuthResponse>('/auth/register', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(input),
  });
}

export function loginUser(input: LoginInput): Promise<AuthResponse> {
  return request<AuthResponse>('/auth/login', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(input),
  });
}

export function createProduct(input: Omit<Product, 'id'>, accessToken: string): Promise<Product> {
  return request<Product>('/products', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${accessToken}`,
    },
    body: JSON.stringify(input),
  });
}
