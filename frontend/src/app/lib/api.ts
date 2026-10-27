import type { Product, Size } from '../types/product';
import type { AuthResponse, LoginInput, RegisterInput } from '../types/auth';

const API_URL = typeof window === 'undefined' 
  ? 'http://backend:3000' 
  : (process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000');

export type OrderStatus = 'PENDING' | 'PAID' | 'PAYMENT_FAILED' | 'CANCELLED';
export type PaymentMethod = 'WALLET' | 'CARD';
export type PaymentAttemptStatus = 'SUCCEEDED' | 'FAILED';

export interface CreateOrderInput {
  items: Array<{
    productId: string;
    size: Size;
    toppings: string[];
    quantity: number;
  }>;
}

export interface OrderResponse {
  id: string;
  code: string;
  userId: string;
  status: OrderStatus;
  totalAmount: number;
  createdAt: string;
  updatedAt: string;
  items: Array<{
    id: string;
    productId: string;
    name: string;
    size: Size;
    toppings: string[];
    quantity: number;
    unitPrice: number;
    subtotal: number;
  }>;
}

export interface CreatePaymentInput {
  orderId: string;
  method: PaymentMethod;
}

export interface PaymentResponse {
  id: string;
  orderId: string;
  orderCode: string;
  amount: number;
  method: PaymentMethod;
  status: PaymentAttemptStatus;
  orderStatus: OrderStatus;
  createdAt: string;
}

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  const response = await fetch(`${API_URL}${path}`, init);
  const body: unknown = await response.json().catch(() => null);

  if (!response.ok) {
    const message =
      typeof body === 'object' && body !== null && 'message' in body
        ? (body as { message?: string | string[] }).message
        : undefined;
    throw new Error(
      Array.isArray(message) ? message.join(', ') : message || 'Yêu cầu thất bại',
    );
  }

  return body as T;
}

function authenticatedHeaders(accessToken: string): HeadersInit {
  return {
    'Content-Type': 'application/json',
    Authorization: `Bearer ${accessToken}`,
  };
}

export async function getProducts(signal?: AbortSignal): Promise<Product[]> {
  return request<Product[]>('/products', { signal });
}

/** Lấy chi tiết sản phẩm theo ID từ backend. */
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

export function createProduct(
  input: Omit<Product, 'id'>,
  accessToken: string,
): Promise<Product> {
  return request<Product>('/products', {
    method: 'POST',
    headers: authenticatedHeaders(accessToken),
    body: JSON.stringify(input),
  });
}

export function createOrder(input: CreateOrderInput, accessToken: string): Promise<OrderResponse> {
  return request<OrderResponse>('/orders', {
    method: 'POST',
    headers: authenticatedHeaders(accessToken),
    body: JSON.stringify(input),
  });
}

export function createPayment(
  input: CreatePaymentInput,
  accessToken: string,
): Promise<PaymentResponse> {
  return request<PaymentResponse>('/payments', {
    method: 'POST',
    headers: authenticatedHeaders(accessToken),
    body: JSON.stringify(input),
  });
}

export function getOrderById(orderId: string, accessToken: string): Promise<OrderResponse> {
  return request<OrderResponse>(`/orders/${encodeURIComponent(orderId)}`, {
    headers: { Authorization: `Bearer ${accessToken}` },
  });
}

export function getMyOrders(accessToken: string): Promise<OrderResponse[]> {
  return request<OrderResponse[]>('/orders/me', {
    headers: { Authorization: `Bearer ${accessToken}` },
  });
}