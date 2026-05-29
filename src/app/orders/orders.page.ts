import { Component } from '@angular/core';

interface Order {
  id: number;
  customer: string;
  menu: string;
  status: string;
  total: number;
}

@Component({
  selector: 'app-orders',
  templateUrl: './orders.page.html',
  styleUrls: ['./orders.page.scss'],
  standalone: false,
})
export class OrdersPage {
  orders: Order[] = [
    { id: 1, customer: 'Andi Saputra', menu: 'Kopi Susu', status: 'Diproses', total: 18000 },
    { id: 2, customer: 'Maya Lestari', menu: 'Roti Bakar', status: 'Selesai', total: 22000 },
    { id: 3, customer: 'Raka Pratama', menu: 'Matcha Latte', status: 'Menunggu', total: 25000 },
  ];

  form: Order = this.createEmptyOrder();
  editingId: number | null = null;

  saveOrder() {
    if (!this.form.customer.trim() || !this.form.menu.trim()) {
      return;
    }

    if (this.editingId) {
      this.orders = this.orders.map((order) =>
        order.id === this.editingId ? { ...this.form, id: this.editingId } : order
      );
    } else {
      this.orders = [
        { ...this.form, id: Date.now() },
        ...this.orders,
      ];
    }

    this.resetForm();
  }

  editOrder(order: Order) {
    this.editingId = order.id;
    this.form = { ...order };
  }

  deleteOrder(id: number) {
    this.orders = this.orders.filter((order) => order.id !== id);
    if (this.editingId === id) {
      this.resetForm();
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
}
