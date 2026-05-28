import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

// Reserved slugs yang tidak bisa dipakai untuk toko
const RESERVED_SLUGS = [
  'api', 'admin', 'toko', '_next', 'uploads',
  'favicon.ico', 'logo.svg', 'robots.txt',
];

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Hanya proses single-segment path (e.g., /minmart)
  // Abaikan root path, path dengan slash lebih dari 1, dan reserved slugs
  const segments = pathname.split('/').filter(Boolean);

  if (segments.length !== 1) {
    return NextResponse.next();
  }

  const slug = segments[0].toLowerCase();

  // Skip reserved slugs
  if (RESERVED_SLUGS.includes(slug)) {
    return NextResponse.next();
  }

  // Skip jika slug mengandung titik (kemungkinan file statis)
  if (slug.includes('.')) {
    return NextResponse.next();
  }

  // Validasi slug dari database via API internal
  try {
    const settingsUrl = new URL('/api/admin/settings', request.url);
    const res = await fetch(settingsUrl);
    if (res.ok) {
      const data = await res.json();
      if (data.storeSlug === slug) {
        // Slug valid - rewrite ke /toko (halaman customer)
        const url = request.nextUrl.clone();
        url.pathname = '/toko';
        return NextResponse.rewrite(url);
      }
    }
  } catch {
    // Jika gagal fetch, lanjutkan normal
  }

  // Slug tidak valid - lanjutkan (akan render 404)
  return NextResponse.next();
}

export const config = {
  matcher: [
    '/((?!api|_next|uploads|favicon.ico|logo.svg|robots.txt).*)',
  ],
};
