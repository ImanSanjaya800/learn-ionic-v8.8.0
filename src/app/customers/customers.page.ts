import { Component, OnInit } from '@angular/core';
import { ApiService, Customer } from '../services/api.service';

@Component({
  selector: 'app-customers',
  templateUrl: './customers.page.html',
  styleUrls: ['./customers.page.scss'],
  standalone: false,
})
export class CustomersPage implements OnInit {
  customers: Customer[] = [];
  form: Customer = this.createEmptyCustomer();
  editingId: number | null = null;
  errorMessage = '';
  isLoading = false;
  isSaving = false;

  constructor(private apiService: ApiService) {}

  ngOnInit() {
    this.loadCustomers();
  }

  async loadCustomers(event?: any) {
    this.isLoading = true;
    this.errorMessage = '';

    try {
      this.customers = await this.apiService.getCustomers();
    } catch (error) {
      this.errorMessage = this.getErrorMessage(error, 'Gagal mengambil data pelanggan');
    } finally {
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

      if (this.editingId) {
        await this.apiService.updateCustomer(this.editingId, payload);
      } else {
        await this.apiService.createCustomer(payload);
      }

      this.resetForm();
      await this.loadCustomers();
    } catch (error) {
      this.errorMessage = this.getErrorMessage(error, 'Gagal menyimpan pelanggan');
    } finally {
      this.isSaving = false;
    }
  }

  editCustomer(customer: Customer) {
    this.editingId = customer.id;
    this.form = { ...customer };
  }

  async deleteCustomer(id: number) {
    this.errorMessage = '';

    try {
      await this.apiService.deleteCustomer(id);
      if (this.editingId === id) {
        this.resetForm();
      }
      await this.loadCustomers();
    } catch (error) {
      this.errorMessage = this.getErrorMessage(error, 'Gagal menghapus pelanggan');
    }
  }

  resetForm() {
    this.editingId = null;
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
}
