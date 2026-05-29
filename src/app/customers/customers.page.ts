import { Component, OnInit } from '@angular/core';
import { ApiService, Customer } from '../services/api.service';
import { OfflineCrudService, OfflineCustomer } from '../services/offline-crud.service';

@Component({
  selector: 'app-customers',
  templateUrl: './customers.page.html',
  styleUrls: ['./customers.page.scss'],
  standalone: false,
})
export class CustomersPage implements OnInit {
  customers: OfflineCustomer[] = [];
  form: OfflineCustomer = this.createEmptyCustomer();
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
    this.loadCustomers();
  }

  async ionViewWillEnter() {
    await this.syncOfflineData();
    await this.loadCustomers();
  }

  async loadCustomers(event?: any) {
    this.isLoading = true;
    this.errorMessage = '';

    try {
      const customers = await this.apiService.getCustomers();
      this.customers = this.offlineCrudService.mergeCustomers(customers);
    } catch (error) {
      this.customers = this.offlineCrudService.mergeCustomers([]);
      this.errorMessage = this.getErrorMessage(error, 'Gagal mengambil data pelanggan');
    } finally {
      this.refreshPendingCount();
      this.isLoading = false;
      event?.target?.complete();
    }
  }

  async saveCustomer() {
    if (!this.form.name.trim() || !this.form.phone.trim()) {
      return;
    }

    this.isSaving = true;
    this.errorMessage = '';

    try {
      const payload = {
        name: this.form.name,
        phone: this.form.phone,
        level: this.form.level,
      };

      if (this.editingOfflineId) {
        this.offlineCrudService.updateOfflineCreate(this.editingOfflineId, payload);
        this.syncMessage = 'Perubahan pelanggan tersimpan offline dan akan disinkronkan otomatis.';
      } else if (this.editingId) {
        await this.apiService.updateCustomer(this.editingId, payload);
      } else {
        await this.apiService.createCustomer(payload);
      }

      this.resetForm();
      await this.loadCustomers();
    } catch (error) {
      const payload = {
        name: this.form.name,
        phone: this.form.phone,
        level: this.form.level,
      };

      if (this.editingId) {
        this.offlineCrudService.enqueueUpdate('customers', this.editingId, payload);
      } else {
        this.offlineCrudService.enqueueCreate('customers', payload);
      }

      this.syncMessage = 'Pelanggan tersimpan offline dan akan dikirim otomatis saat koneksi/API aktif.';
      this.resetForm();
      this.customers = this.offlineCrudService.mergeCustomers(this.customers.filter((customer) => !customer.offlineStatus) as Customer[]);
      this.refreshPendingCount();
    } finally {
      this.isSaving = false;
    }
  }

  editCustomer(customer: OfflineCustomer) {
    this.editingId = customer.offlineAction === 'create' ? null : customer.id;
    this.editingOfflineId = customer.offlineAction === 'create' ? customer.offlineId || null : null;
    this.form = { ...customer };
  }

  async deleteCustomer(customer: OfflineCustomer) {
    this.errorMessage = '';

    if (customer.offlineAction === 'create' && customer.offlineId) {
      this.offlineCrudService.removeOfflineCreate(customer.offlineId);
      this.syncMessage = 'Pelanggan offline dihapus dari antrean sinkronisasi.';
      this.resetForm();
      await this.loadCustomers();
      return;
    }

    try {
      await this.apiService.deleteCustomer(customer.id);
      if (this.editingId === customer.id) {
        this.resetForm();
      }
      await this.loadCustomers();
    } catch (error) {
      this.offlineCrudService.enqueueDelete('customers', customer.id);
      this.syncMessage = 'Penghapusan pelanggan disimpan offline dan akan disinkronkan otomatis.';
      this.customers = this.customers.filter((item) => item.id !== customer.id);
      this.refreshPendingCount();
    }
  }

  resetForm() {
    this.editingId = null;
    this.editingOfflineId = null;
    this.form = this.createEmptyCustomer();
  }

  private createEmptyCustomer(): Customer {
    return {
      id: 0,
      name: '',
      phone: '',
      level: 'Bronze',
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
    this.pendingOfflineCount = this.offlineCrudService.getPendingCount('customers');
  }
}
