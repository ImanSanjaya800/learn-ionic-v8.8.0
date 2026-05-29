import { Component, OnInit } from '@angular/core';
import { ApiService, Product } from '../services/api.service';
import { OfflineCrudService, OfflineProduct } from '../services/offline-crud.service';

@Component({
  selector: 'app-products',
  templateUrl: './products.page.html',
  styleUrls: ['./products.page.scss'],
  standalone: false,
})
export class ProductsPage implements OnInit {
  products: OfflineProduct[] = [];
  form: OfflineProduct = this.createEmptyProduct();
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
    this.loadProducts();
  }

  async ionViewWillEnter() {
    await this.syncOfflineData();
    await this.loadProducts();
  }

  async loadProducts(event?: any) {
    this.isLoading = true;
    this.errorMessage = '';

    try {
      const products = await this.apiService.getProducts();
      this.products = this.offlineCrudService.mergeProducts(products);
    } catch (error) {
      this.products = this.offlineCrudService.mergeProducts([]);
      this.errorMessage = this.getErrorMessage(error, 'Gagal mengambil data produk');
    } finally {
      this.refreshPendingCount();
      this.isLoading = false;
      event?.target?.complete();
    }
  }

  async saveProduct() {
    if (!this.form.name.trim() || !this.form.category.trim()) {
      return;
    }

    this.isSaving = true;
    this.errorMessage = '';

    try {
      const payload = {
        name: this.form.name,
        category: this.form.category,
        stock: Number(this.form.stock),
        price: Number(this.form.price),
      };

      if (this.editingOfflineId) {
        this.offlineCrudService.updateOfflineCreate(this.editingOfflineId, payload);
        this.syncMessage = 'Perubahan produk tersimpan offline dan akan disinkronkan otomatis.';
      } else if (this.editingId) {
        await this.apiService.updateProduct(this.editingId, payload);
      } else {
        await this.apiService.createProduct(payload);
      }

      this.resetForm();
      await this.loadProducts();
    } catch (error) {
      const payload = {
        name: this.form.name,
        category: this.form.category,
        stock: Number(this.form.stock),
        price: Number(this.form.price),
      };

      if (this.editingId) {
        this.offlineCrudService.enqueueUpdate('products', this.editingId, payload);
      } else {
        this.offlineCrudService.enqueueCreate('products', payload);
      }

      this.syncMessage = 'Produk tersimpan offline dan akan dikirim otomatis saat koneksi/API aktif.';
      this.resetForm();
      this.products = this.offlineCrudService.mergeProducts(this.products.filter((product) => !product.offlineStatus) as Product[]);
      this.refreshPendingCount();
    } finally {
      this.isSaving = false;
    }
  }

  editProduct(product: OfflineProduct) {
    this.editingId = product.offlineAction === 'create' ? null : product.id;
    this.editingOfflineId = product.offlineAction === 'create' ? product.offlineId || null : null;
    this.form = { ...product };
  }

  async deleteProduct(product: OfflineProduct) {
    this.errorMessage = '';

    if (product.offlineAction === 'create' && product.offlineId) {
      this.offlineCrudService.removeOfflineCreate(product.offlineId);
      this.syncMessage = 'Produk offline dihapus dari antrean sinkronisasi.';
      this.resetForm();
      await this.loadProducts();
      return;
    }

    try {
      await this.apiService.deleteProduct(product.id);
      if (this.editingId === product.id) {
        this.resetForm();
      }
      await this.loadProducts();
    } catch (error) {
      this.offlineCrudService.enqueueDelete('products', product.id);
      this.syncMessage = 'Penghapusan produk disimpan offline dan akan disinkronkan otomatis.';
      this.products = this.products.filter((item) => item.id !== product.id);
      this.refreshPendingCount();
    }
  }

  resetForm() {
    this.editingId = null;
    this.editingOfflineId = null;
    this.form = this.createEmptyProduct();
  }

  private createEmptyProduct(): Product {
    return {
      id: 0,
      name: '',
      category: '',
      stock: 0,
      price: 0,
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
    this.pendingOfflineCount = this.offlineCrudService.getPendingCount('products');
  }
}
