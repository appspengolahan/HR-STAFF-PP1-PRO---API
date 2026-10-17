import { AppBrandingSettings } from '../types';

/**
 * Kompres gambar yang diunggah pengguna ke Data URL WebP/PNG beresolusi 512x512
 * agar ukuran file ringan (< 80KB) dan aman disimpan di localStorage tanpa lag.
 */
export function compressImageFile(file: File, maxDim: number = 512): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      const img = new Image();
      img.onload = () => {
        let width = img.width;
        let height = img.height;

        // Pertahankan rasio aspek
        if (width > height) {
          if (width > maxDim) {
            height = Math.round((height * maxDim) / width);
            width = maxDim;
          }
        } else {
          if (height > maxDim) {
            width = Math.round((width * maxDim) / height);
            height = maxDim;
          }
        }

        const canvas = document.createElement('canvas');
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        if (!ctx) {
          resolve(String(e.target?.result || ''));
          return;
        }

        ctx.drawImage(img, 0, 0, width, height);
        // Coba kompres ke PNG/WebP
        const dataUrl = canvas.toDataURL('image/png', 0.92);
        resolve(dataUrl);
      };
      img.onerror = () => reject(new Error('Gagal memproses file gambar.'));
      img.src = String(e.target?.result);
    };
    reader.onerror = () => reject(new Error('Gagal membaca file gambar.'));
    reader.readAsDataURL(file);
  });
}

/**
 * Terapkan branding secara dinamis ke runtime browser:
 * - Update Document Title
 * - Update Meta Tags (og:title, apple-mobile-web-app-title)
 * - Update Favicon browser tab
 * - Update PWA Web App Manifest secara dinamis via Blob URL (agar install prompt HP membaca logo & nama baru)
 */
export function applyDynamicBranding(branding: AppBrandingSettings): void {
  if (typeof document === 'undefined') return;

  // 1. Update Title & Meta
  document.title = branding.appName || 'HR STAFF - PRODUKSI I';

  const metaAppleTitle = document.querySelector<HTMLMetaElement>('meta[name="apple-mobile-web-app-title"]');
  if (metaAppleTitle) {
    metaAppleTitle.content = branding.appShortName || 'HR STAFF I';
  }

  const metaOgTitle = document.querySelector<HTMLMetaElement>('meta[property="og:title"]');
  if (metaOgTitle) {
    metaOgTitle.content = branding.appName || 'HR STAFF - PRODUKSI I';
  }

  // 2. Update Favicon & Apple Touch Icon
  if (branding.logoUrl) {
    const iconLinks = document.querySelectorAll<HTMLLinkElement>("link[rel*='icon'], link[rel='apple-touch-icon']");
    iconLinks.forEach((link) => {
      link.href = branding.logoUrl!;
    });

    // 3. Update PWA Manifest dynamically via Blob URL
    try {
      const dynamicManifest = {
        id: '/',
        name: branding.appName || 'HR STAFF - PRODUKSI I',
        short_name: branding.appShortName || 'HR STAFF I',
        description: branding.appSubtitle || 'Sistem HR Staff & Karyawan Divisi Produksi I — PT Batu Karang.',
        theme_color: '#0f172a',
        background_color: '#0f172a',
        display: 'standalone',
        orientation: 'portrait-primary',
        start_url: '/',
        scope: '/',
        icons: [
          {
            src: branding.logoUrl,
            sizes: '192x192 512x512',
            type: 'image/png',
            purpose: 'any maskable',
          },
        ],
      };

      const manifestBlob = new Blob([JSON.stringify(dynamicManifest, null, 2)], {
        type: 'application/manifest+json',
      });
      const manifestBlobUrl = URL.createObjectURL(manifestBlob);

      const manifestLink = document.querySelector<HTMLLinkElement>("link[rel='manifest']");
      if (manifestLink) {
        manifestLink.href = manifestBlobUrl;
      }
    } catch (e) {
      console.warn('Gagal memperbarui manifest PWA dinamis:', e);
    }
  } else {
    // Reset ke file bawaan /manifest.json & /icon.svg
    const manifestLink = document.querySelector<HTMLLinkElement>("link[rel='manifest']");
    if (manifestLink && manifestLink.href.startsWith('blob:')) {
      manifestLink.href = '/manifest.json';
    }
    const favLink = document.querySelector<HTMLLinkElement>("link[rel='icon'][type='image/svg+xml']");
    if (favLink) {
      favLink.href = '/icon.svg';
    }
    const appleLink = document.querySelector<HTMLLinkElement>("link[rel='apple-touch-icon']");
    if (appleLink) {
      appleLink.href = '/apple-touch-icon.png';
    }
  }
}
