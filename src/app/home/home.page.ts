import { Component } from '@angular/core';
import { CrudEntity, OfflineCrudService } from '../services/offline-crud.service';

interface MenuCard {
  title: string;
  subtitle: string;
  description: string;
  color: string;
  icon: string;
  route: string;
  entity: CrudEntity;
}

@Component({
  selector: 'app-home',
  templateUrl: 'home.page.html',
  styleUrls: ['home.page.scss'],
  standalone: false,
})
export class HomePage {
  menus: MenuCard[] = [
    {
      title: 'Produk',
      subtitle: 'Kelola data produk',
      description: 'Tambah, edit, dan hapus data produk beserta stok dan harga.',
      color: 'primary',
      icon: 'cube-outline',
      route: '/products',
      entity: 'products',
    },
    {
      title: 'Pelanggan',
      subtitle: 'Kelola data pelanggan',
      description: 'Simpan data pelanggan, nomor HP, dan level membership.',
      color: 'secondary',
      icon: 'people-outline',
      route: '/customers',
      entity: 'customers',
    },
    {
      title: 'Pesanan',
      subtitle: 'Kelola data pesanan',
      description: 'Catat pesanan, status transaksi, dan total pembayaran.',
      color: 'warning',
      icon: 'receipt-outline',
      route: '/orders',
      entity: 'orders',
    },
  ];

  pendingCounts: Record<CrudEntity, number> = {
    products: 0,
    customers: 0,
    orders: 0,
  };

  constructor(private offlineCrudService: OfflineCrudService) {}

  async ionViewWillEnter() {
    await this.syncOfflineData();
  }

  getPendingCount(entity: CrudEntity): number {
    return this.pendingCounts[entity];
  }

  private async syncOfflineData() {
    await this.offlineCrudService.syncPendingOperations();
    this.pendingCounts = {
      products: this.offlineCrudService.getPendingCount('products'),
      customers: this.offlineCrudService.getPendingCount('customers'),
      orders: this.offlineCrudService.getPendingCount('orders'),
    };
  }

}
