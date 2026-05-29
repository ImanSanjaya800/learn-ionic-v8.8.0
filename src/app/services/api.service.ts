import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { firstValueFrom } from 'rxjs';
import { environment } from '../../environments/environment';

interface ApiResponse<T> {
  success: boolean;
  message: string;
  data?: T;
}

export interface Product {
  id: number;
  name: string;
  category: string;
  stock: number;
  price: number;
}

export interface Customer {
  id: number;
  name: string;
  phone: string;
  level: string;
}

export interface Order {
  id: number;
  customer: string;
  menu: string;
  status: string;
  total: number;
}

type ProductPayload = Omit<Product, 'id'>;
type CustomerPayload = Omit<Customer, 'id'>;
type OrderPayload = Omit<Order, 'id'>;

@Injectable({
  providedIn: 'root',
})
export class ApiService {
  private readonly baseUrl = environment.apiBaseUrl;

  constructor(private http: HttpClient) {}

  async getProducts(): Promise<Product[]> {
    const products = await this.request<Product[]>('products.php');
    return products.map((product) => this.normalizeProduct(product));
  }

  async createProduct(payload: ProductPayload): Promise<Product> {
    const product = await this.request<Product>('products.php', 'POST', payload);
    return this.normalizeProduct(product);
  }

  async updateProduct(id: number, payload: ProductPayload): Promise<Product> {
    const product = await this.request<Product>(`products.php?id=${id}`, 'PUT', payload);
    return this.normalizeProduct(product);
  }

  async deleteProduct(id: number): Promise<void> {
    await this.request<null>(`products.php?id=${id}`, 'DELETE');
  }

  async getCustomers(): Promise<Customer[]> {
    return this.request<Customer[]>('customers.php');
  }

  async createCustomer(payload: CustomerPayload): Promise<Customer> {
    return this.request<Customer>('customers.php', 'POST', payload);
  }

  async updateCustomer(id: number, payload: CustomerPayload): Promise<Customer> {
    return this.request<Customer>(`customers.php?id=${id}`, 'PUT', payload);
  }

  async deleteCustomer(id: number): Promise<void> {
    await this.request<null>(`customers.php?id=${id}`, 'DELETE');
  }

  async getOrders(): Promise<Order[]> {
    const orders = await this.request<Order[]>('orders.php');
    return orders.map((order) => this.normalizeOrder(order));
  }

  async createOrder(payload: OrderPayload): Promise<Order> {
    const order = await this.request<Order>('orders.php', 'POST', payload);
    return this.normalizeOrder(order);
  }

  async updateOrder(id: number, payload: OrderPayload): Promise<Order> {
    const order = await this.request<Order>(`orders.php?id=${id}`, 'PUT', payload);
    return this.normalizeOrder(order);
  }

  async deleteOrder(id: number): Promise<void> {
    await this.request<null>(`orders.php?id=${id}`, 'DELETE');
  }

  private async request<T>(path: string, method: 'GET' | 'POST' | 'PUT' | 'DELETE' = 'GET', body?: unknown): Promise<T> {
    const url = `${this.baseUrl}/${path}`;
    const response = await firstValueFrom(
      this.http.request<ApiResponse<T>>(method, url, { body })
    );

    if (!response.success) {
      throw new Error(response.message || 'Request gagal');
    }

    return response.data as T;
  }

  private normalizeProduct(product: Product): Product {
    return {
      ...product,
      id: Number(product.id),
      stock: Number(product.stock),
      price: Number(product.price),
    };
  }

  private normalizeOrder(order: Order): Order {
    return {
      ...order,
      id: Number(order.id),
      total: Number(order.total),
    };
  }
}
