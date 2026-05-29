import { Component } from '@angular/core';

interface MenuCard {
  title: string;
  subtitle: string;
  description: string;
  color: string;
  icon: string;
  route: string;
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
    },
    {
      title: 'Pelanggan',
      subtitle: 'Kelola data pelanggan',
      description: 'Simpan data pelanggan, nomor HP, dan level membership.',
      color: 'secondary',
      icon: 'people-outline',
      route: '/customers',
    },
    {
      title: 'Pesanan',
      subtitle: 'Kelola data pesanan',
      description: 'Catat pesanan, status transaksi, dan total pembayaran.',
      color: 'warning',
      icon: 'receipt-outline',
      route: '/orders',
    },
  ];

  constructor() {}

}
