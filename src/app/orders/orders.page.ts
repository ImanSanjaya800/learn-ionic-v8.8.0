import { Component, OnInit } from '@angular/core';
import { ApiService, Order } from '../services/api.service';

@Component({
  selector: 'app-orders',
  templateUrl: './orders.page.html',
  styleUrls: ['./orders.page.scss'],
  standalone: false,
})
export class OrdersPage implements OnInit {
  orders: Order[] = [];
  form: Order = this.createEmptyOrder();
  editingId: number | null = null;
  errorMessage = '';
  isLoading = false;
  isSaving = false;

  constructor(private apiService: ApiService) {}

  ngOnInit() {
    this.loadOrders();
  }

  async loadOrders(event?: any) {
    this.isLoading = true;
    this.errorMessage = '';

    try {
      this.orders = await this.apiService.getOrders();
    } catch (error) {
      this.errorMessage = this.getErrorMessage(error, 'Gagal mengambil data pesanan');
    } finally {
      this.isLoading = false;
      event?.target?.complete();
    }
  }

  async saveOrder() {
    if (!this.form.customer.trim() || !this.form.menu.trim()) {
      return;
    }

    this.isSaving = true;
    this.errorMessage = '';

    try {
      const payload = {
        customer: this.form.customer,
        menu: this.form.menu,
        status: this.form.status,
        total: Number(this.form.total),
      };

      if (this.editingId) {
        await this.apiService.updateOrder(this.editingId, payload);
      } else {
        await this.apiService.createOrder(payload);
      }

      this.resetForm();
      await this.loadOrders();
    } catch (error) {
      this.errorMessage = this.getErrorMessage(error, 'Gagal menyimpan pesanan');
    } finally {
      this.isSaving = false;
    }
  }

  editOrder(order: Order) {
    this.editingId = order.id;
    this.form = { ...order };
  }

  async deleteOrder(id: number) {
    this.errorMessage = '';

    try {
      await this.apiService.deleteOrder(id);
      if (this.editingId === id) {
        this.resetForm();
      }
      await this.loadOrders();
    } catch (error) {
      this.errorMessage = this.getErrorMessage(error, 'Gagal menghapus pesanan');
    }
  }

  resetForm() {
    this.editingId = null;
    this.form = this.createEmptyOrder();
  }

  private createEmptyOrder(): Order {
    return {
      id: 0,
      customer: '',
      menu: '',
      status: 'Menunggu',
      total: 0,
    };
  }

  private getErrorMessage(error: unknown, fallback: string): string {
    return error instanceof Error ? error.message : fallback;
  }
}
