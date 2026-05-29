import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';

interface WelcomeSlide {
  icon: string;
  title: string;
  subtitle: string;
  points: string[];
  color: string;
}

@Component({
  selector: 'app-welcome',
  templateUrl: './welcome.page.html',
  styleUrls: ['./welcome.page.scss'],
  standalone: false,
})
export class WelcomePage implements OnInit {
  private readonly agreementKey = 'crud_app_privacy_agreed';

  activeSlide = 0;
  hasAgreed = false;

  slides: WelcomeSlide[] = [
    {
      icon: 'apps-outline',
      title: 'Aplikasi CRUD Ionic',
      subtitle: 'Kelola data lewat tampilan mobile yang rapi dan mudah dipakai.',
      points: ['Menu produk', 'Menu pelanggan', 'Menu pesanan'],
      color: 'primary',
    },
    {
      icon: 'create-outline',
      title: 'Tambah dan Edit Data',
      subtitle: 'Setiap halaman punya form untuk membuat data baru atau memperbarui data yang sudah ada.',
      points: ['Input cepat', 'Validasi sederhana', 'Simpan ke database MySQL'],
      color: 'secondary',
    },
    {
      icon: 'sync-outline',
      title: 'Terhubung ke Backend PHP',
      subtitle: 'Data diambil dari API native PHP dan bisa di-refresh langsung dari aplikasi.',
      points: ['GET data', 'POST data baru', 'PUT dan DELETE data'],
      color: 'tertiary',
    },
    {
      icon: 'shield-checkmark-outline',
      title: 'Privacy Policy',
      subtitle: 'Aplikasi ini memakai data yang kamu input hanya untuk kebutuhan demo CRUD produk, pelanggan, dan pesanan.',
      points: ['Data dikirim ke API backend PHP', 'Data tersimpan di database MySQL', 'Lanjutkan hanya jika kamu setuju'],
      color: 'warning',
    },
  ];

  constructor(private router: Router) {}

  ngOnInit() {
    if (localStorage.getItem(this.agreementKey) === 'true') {
      this.router.navigateByUrl('/home', { replaceUrl: true });
    }
  }

  get isLastSlide(): boolean {
    return this.activeSlide === this.slides.length - 1;
  }

  nextSlide() {
    if (this.isLastSlide) {
      this.enterApp();
      return;
    }

    this.activeSlide += 1;
  }

  previousSlide() {
    if (this.activeSlide > 0) {
      this.activeSlide -= 1;
    }
  }

  goToSlide(index: number) {
    this.activeSlide = index;
  }

  skipToPrivacy() {
    this.activeSlide = this.slides.length - 1;
  }

  enterApp() {
    if (!this.hasAgreed) {
      return;
    }

    localStorage.setItem(this.agreementKey, 'true');
    this.router.navigateByUrl('/home', { replaceUrl: true });
  }
}
