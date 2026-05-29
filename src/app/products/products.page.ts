import { Component } from '@angular/core';

interface Product {
  id: number;
  name: string;
  category: string;
  stock: number;
  price: number;
}

@Component({
  selector: 'app-products',
  templateUrl: './products.page.html',
  styleUrls: ['./products.page.scss'],
  standalone: false,
})
export class ProductsPage {
  products: Product[] = [
    { id: 1, name: 'Kopi Susu', category: 'Minuman', stock: 24, price: 18000 },
    { id: 2, name: 'Roti Bakar', category: 'Makanan', stock: 15, price: 22000 },
    { id: 3, name: 'Matcha Latte', category: 'Minuman', stock: 18, price: 25000 },
  ];

  form: Product = this.createEmptyProduct();
  editingId: number | null = null;

  saveProduct() {
    if (!this.form.name.trim() || !this.form.category.trim()) {
      return;
    }

    if (this.editingId) {
      this.products = this.products.map((product) =>
        product.id === this.editingId ? { ...this.form, id: this.editingId } : product
      );
    } else {
      this.products = [
        { ...this.form, id: Date.now() },
        ...this.products,
      ];
    }

    this.resetForm();
  }

  editProduct(product: Product) {
    this.editingId = product.id;
    this.form = { ...product };
  }

  deleteProduct(id: number) {
    this.products = this.products.filter((product) => product.id !== id);
    if (this.editingId === id) {
      this.resetForm();
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
}
