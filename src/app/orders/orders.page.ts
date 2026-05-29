import { Component, OnInit } from '@angular/core';
import { ApiService, Order } from '../services/api.service';
import { OfflineCrudService, OfflineOrder } from '../services/offline-crud.service';

@Component({
  selector: 'app-orders',
  templateUrl: './orders.page.html',
  styleUrls: ['./orders.page.scss'],
  standalone: false,
})
export class OrdersPage implements OnInit {
  orders: OfflineOrder[] = [];
  form: OfflineOrder = this.createEmptyOrder();
  editingId: number | null = null;
  editingOfflineId: string | null = null;
  errorMessage = '';
  syncMessage = '';
  isLoading = false;
  isSaving = false;
  pendingOfflineCount = 0;

  constructor(
    private apiService: ApiService,
    private offlineCrudService: OfflineCrudService
  ) {}

  ngOnInit() {
    this.loadOrders();
  }

  async ionViewWillEnter() {
    await this.syncOfflineData();
    await this.loadOrders();
  }

  async loadOrders(event?: any) {
    this.isLoading = true;
    this.errorMessage = '';

    try {
      const orders = await this.apiService.getOrders();
      this.orders = this.offlineCrudService.mergeOrders(orders);
    } catch (error) {
      this.orders = this.offlineCrudService.mergeOrders([]);
      this.errorMessage = this.getErrorMessage(error, 'Gagal mengambil data pesanan');
    } finally {
      this.refreshPendingCount();
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

      if (this.editingOfflineId) {
        this.offlineCrudService.updateOfflineCreate(this.editingOfflineId, payload);
        this.syncMessage = 'Perubahan pesanan tersimpan offline dan akan disinkronkan otomatis.';
      } else if (this.editingId) {
        await this.apiService.updateOrder(this.editingId, payload);
      } else {
        await this.apiService.createOrder(payload);
      }

      this.resetForm();
      await this.loadOrders();
    } catch (error) {
      const payload = {
        customer: this.form.customer,
        menu: this.form.menu,
        status: this.form.status,
        total: Number(this.form.total),
      };

      if (this.editingId) {
        this.offlineCrudService.enqueueUpdate('orders', this.editingId, payload);
      } else {
        this.offlineCrudService.enqueueCreate('orders', payload);
      }

      this.syncMessage = 'Pesanan tersimpan offline dan akan dikirim otomatis saat koneksi/API aktif.';
      this.resetForm();
      this.orders = this.offlineCrudService.mergeOrders(this.orders.filter((order) => !order.offlineStatus) as Order[]);
      this.refreshPendingCount();
    } finally {
      this.isSaving = false;
    }
  }

  editOrder(order: OfflineOrder) {
    this.editingId = order.offlineAction === 'create' ? null : order.id;
    this.editingOfflineId = order.offlineAction === 'create' ? order.offlineId || null : null;
    this.form = { ...order };
  }

  async deleteOrder(order: OfflineOrder) {
    this.errorMessage = '';

    if (order.offlineAction === 'create' && order.offlineId) {
      this.offlineCrudService.removeOfflineCreate(order.offlineId);
      this.syncMessage = 'Pesanan offline dihapus dari antrean sinkronisasi.';
      this.resetForm();
      await this.loadOrders();
      return;
    }

    try {
      await this.apiService.deleteOrder(order.id);
      if (this.editingId === order.id) {
        this.resetForm();
      }
      await this.loadOrders();
    } catch (error) {
      this.offlineCrudService.enqueueDelete('orders', order.id);
      this.syncMessage = 'Penghapusan pesanan disimpan offline dan akan disinkronkan otomatis.';
      this.orders = this.orders.filter((item) => item.id !== order.id);
      this.refreshPendingCount();
    }
  }

  resetForm() {
    this.editingId = null;
    this.editingOfflineId = null;
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

  private async syncOfflineData() {
    this.refreshPendingCount();

    if (this.offlineCrudService.getPendingCount() === 0) {
      return;
    }

    const syncedCount = await this.offlineCrudService.syncPendingOperations();
    this.refreshPendingCount();

    if (syncedCount > 0) {
      this.syncMessage = `${syncedCount} data offline berhasil disinkronkan.`;
    }
  }

  private refreshPendingCount() {
    this.pendingOfflineCount = this.offlineCrudService.getPendingCount('orders');
  }
}
