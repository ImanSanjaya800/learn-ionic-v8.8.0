import { Component, OnInit } from '@angular/core';
import { ApiService, Product } from '../services/api.service';

@Component({
  selector: 'app-products',
  templateUrl: './products.page.html',
  styleUrls: ['./products.page.scss'],
  standalone: false,
})
export class ProductsPage implements OnInit {
  products: Product[] = [];
  form: Product = this.createEmptyProduct();
  editingId: number | null = null;
  errorMessage = '';
  isLoading = false;
  isSaving = false;

  constructor(private apiService: ApiService) {}

  ngOnInit() {
    this.loadProducts();
  }

  async loadProducts(event?: any) {
    this.isLoading = true;
    this.errorMessage = '';

    try {
      this.products = await this.apiService.getProducts();
    } catch (error) {
      this.errorMessage = this.getErrorMessage(error, 'Gagal mengambil data produk');
    } finally {
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

      if (this.editingId) {
        await this.apiService.updateProduct(this.editingId, payload);
      } else {
        await this.apiService.createProduct(payload);
      }

      this.resetForm();
      await this.loadProducts();
    } catch (error) {
      this.errorMessage = this.getErrorMessage(error, 'Gagal menyimpan produk');
    } finally {
      this.isSaving = false;
    }
  }

  editProduct(product: Product) {
    this.editingId = product.id;
    this.form = { ...product };
  }

  async deleteProduct(id: number) {
    this.errorMessage = '';

    try {
      await this.apiService.deleteProduct(id);
      if (this.editingId === id) {
        this.resetForm();
      }
      await this.loadProducts();
    } catch (error) {
      this.errorMessage = this.getErrorMessage(error, 'Gagal menghapus produk');
    }
  }

  resetForm() {
    this.editingId = null;
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
}
