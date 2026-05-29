import { Component } from '@angular/core';

interface Customer {
  id: number;
  name: string;
  phone: string;
  level: string;
}

@Component({
  selector: 'app-customers',
  templateUrl: './customers.page.html',
  styleUrls: ['./customers.page.scss'],
  standalone: false,
})
export class CustomersPage {
  customers: Customer[] = [
    { id: 1, name: 'Andi Saputra', phone: '0812-3456-7890', level: 'Gold' },
    { id: 2, name: 'Maya Lestari', phone: '0821-1111-2233', level: 'Silver' },
    { id: 3, name: 'Raka Pratama', phone: '0857-4444-8899', level: 'Bronze' },
  ];

  form: Customer = this.createEmptyCustomer();
  editingId: number | null = null;

  saveCustomer() {
    if (!this.form.name.trim() || !this.form.phone.trim()) {
      return;
    }

    if (this.editingId) {
      this.customers = this.customers.map((customer) =>
        customer.id === this.editingId ? { ...this.form, id: this.editingId } : customer
      );
    } else {
      this.customers = [
        { ...this.form, id: Date.now() },
        ...this.customers,
      ];
    }

    this.resetForm();
  }

  editCustomer(customer: Customer) {
    this.editingId = customer.id;
    this.form = { ...customer };
  }

  deleteCustomer(id: number) {
    this.customers = this.customers.filter((customer) => customer.id !== id);
    if (this.editingId === id) {
      this.resetForm();
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
}
