# Panduan Penggunaan `createPrismaRepository`

`createPrismaRepository` adalah sebuah factory function/helper di dalam boilerplate NestJS ini yang dirancang untuk mengabstraksi akses data menggunakan **Prisma Client** sekaligus mengintegrasikan beberapa fitur advanced secara transparan:
1. **Auto-Caching & Invalidation** (didukung oleh Redis).
2. **Row-Level Locking** (Pessimistic Locking pada database PostgreSQL).
3. **Relation Split & Automated Composition** (Pemisahan select & penggabungan relasi virtual lintas-modul menggunakan `BaseComposeHelper`).
4. **Resiliensi Caching (Fail-Open)** & **Thundering Herd / Stampede Protection**.

Tujuan utama dari layer repositori ini adalah memisahkan logika akses data dari Service (`Controller` → `Service` → `Repository` → `Database`/`Redis`) sehingga kode Service tetap bersih (hanya memiliki method `handle*`) dan akses database serta pengelolaan cache tetap konsisten di seluruh aplikasi.

---

## 1. Konfigurasi `createPrismaRepository`

Factory function ini didefinisikan di dalam [create-prisma.repository.ts](file:///home/fikiap23/sasana/kalventis/boilerplate-nest/src/infrastructure/prisma/create-prisma.repository.ts). Berikut adalah opsi konfigurasi yang didukung saat membuat instance repository:

```typescript
export const MyRepository = createPrismaRepository<
  TSelect,         // Prisma Select Type (contoh: Prisma.UserSelect)
  TCreateInput,    // Prisma Create Input Type
  TUpdateInput,    // Prisma Update Input Type
  TWhereInput,     // Prisma Where Input Type
  TOrderBy,        // Prisma OrderBy Type
  TToPayload,      // Mapper function untuk payload (toPayload)
  TRepoModel       // Model name string (opsional, untuk cache/invalidation)
>({
  model: 'myModel', // Nama model yang terdaftar di PrismaSelectPayloadMap
  
  // Konfigurasi Cache (Opsional)
  cache: {
    ttl: 3600,                   // TTL default untuk data yang di-cache (detik)
    nullTtl: 60,                 // TTL untuk caching hasil null / negative caching (detik)
    sensitiveFields: ['password'], // Field yang jika masuk select akan men-bypass cache
    methods: {                   // Custom TTL per method read
      getManyPaginate: { ttl: 300 },
      getMany: { ttl: 300 },
      getFirst: { enabled: false }, // bypass cache untuk method getFirst
    },
    // Fungsi untuk me-resolve cache tags secara dinamis dari data entitas
    getTags: (entity: any) => [`tenant:${entity.tenantId}`], 
  },

  // Konfigurasi Row-Level Lock (Opsional)
  lock: {
    tableName: 'my_table',       // Nama tabel asli di database (seperti di @@map)
    columns: {                   // Pemetaan properti Prisma ke nama kolom fisik DB
      createdAt: 'created_at',
      updatedAt: 'updated_at',
    },
  },

  // Mengambil delegate Prisma model
  getDelegate: (client) => client.myModel,
  
  // Fungsi pemetaan payload untuk type-safety select query
  toPayload: <T extends Prisma.MyModelSelect>(data: unknown) => data as MyPayload<T>,
  
  // Enum scalar fields dari model Prisma (dibutuhkan jika memakai composeHelper)
  scalarFields: Prisma.MyModelScalarFieldEnum,
  
  // Token compose helper NestJS untuk stitching data relasi lintas-modul
  composeHelperToken: forwardRef(() => MyComposeHelper),
});
```

---

## 2. API & Metode Repository

Semua instance repository yang dibuat lewat factory memiliki method standar berikut:

### Operasi Read (Mendukung Cache)
Operasi read hanya akan membaca/menulis ke cache Redis jika:
1. Properti `model` dan `cache` telah dikonfigurasi pada factory.
2. Parameter `setCache: true` dikirim saat pemanggilan method.
3. Query `select` tidak menyertakan field sensitif (seperti `password`).
4. Operasi tidak berjalan di dalam transaksi database (`tx`).

*   **`getById({ id, select?, tx?, setCache?, lock? })`**
    Mengambil data berdasarkan ID (bisa mengembalikan `null`).
*   **`getThrowById({ id, select?, tx?, setCache?, lock? })`**
    Mengambil data berdasarkan ID, melempar error (`NotFoundError`) jika tidak ditemukan.
*   **`getFirst({ where?, select?, setCache?, cacheTags?, tx? })`**
    Mengambil data pertama yang cocok dengan kriteria `where`.
*   **`getMany({ where?, select?, orderBy?, take?, skip?, setCache?, cacheTags?, tx? })`**
    Mengambil daftar data berdasarkan kriteria.
*   **`getManyPaginate({ where?, select?, orderBy?, page?, limit?, setCache?, cacheTags?, tx? })`**
    Mengambil daftar data berhalaman dengan format hasil pagination `{ data, meta }`.

### Operasi Write (Mengotomatisasi Invalidation)
Operasi write akan secara otomatis menghapus cache yang relevan di Redis sesaat setelah database selesai melakukan penulisan/pembaruan (jika tidak berjalan di dalam transaksi `tx`).

*   **`create({ data, select?, tx?, invalidate?, tags? })`**
    Menyimpan data baru. Invalidation default: `'queries'`.
*   **`updateById({ id, data, select?, tx?, invalidate?, tags? })`**
    Memperbarui data berdasarkan ID. Invalidation default: `'all'`.
*   **`deleteById({ id, select?, tx?, invalidate?, tags? })`**
    Menghapus data berdasarkan ID. Invalidation default: `'all'`.
*   **`invalidateCache({ id?, tags? })`**
    Method utilitas untuk melakukan invalidasi cache secara manual. Berguna untuk membersihkan data entitas berdasarkan ID dan/atau sekumpulan cache tags secara spesifik.

---

## 3. Fitur Utama Secara Detail

### A. Mekanisme Caching & Invalidation
Sistem cache dirancang berbasis pola **Cache-Aside** dengan penanganan edge-case modern:
*   **Negative Caching**: Hasil query yang bernilai `null` tetap di-cache dengan TTL pendek (`nullTtl`) untuk menghindari overload database akibat request data yang tidak ada secara berulang.
*   **Stampede Protection (Lightweight SetNx Lock)**: Menghindari fenomena *cache stampede* di mana ratusan request secara bersamaan menembak database saat cache miss. Request pertama akan mengunci key (`SETNX`), request berikutnya akan menunggu sejenak (`sleep`) dan mencoba mengambil lagi dari Redis.
*   **TTL Jitter**: Setiap TTL yang diset ke Redis ditambahkan variasi acak sekitar `±10%` (`applyJitter`) guna mencegah masa kadaluwarsa massal pada waktu yang sama.
*   **Fail-Open**: Caching didesain opsional dan tidak memblokir aplikasi. Jika server Redis mati, query akan diteruskan langsung ke PostgreSQL tanpa melempar error HTTP ke user.

### B. Mode Invalidation pada Write
Saat memanggil operasi write, Anda dapat mengatur strategi pembersihan cache lewat argumen `invalidate`:
*   `'all'`: Menghapus cache spesifik entitas (berdasarkan ID) **dan** seluruh query list (`getMany`/`getManyPaginate`) untuk model tersebut.
*   `'entity'`: Hanya menghapus cache spesifik entitas (by ID).
*   `'queries'`: Hanya menghapus cache query list.
*   `'none'`: Melewati proses invalidasi (sangat berguna untuk update metadata seperti `lastLoginAt` atau tracker yang tidak memengaruhi data respons API).

### C. Row-Level Locking (Pessimistic Lock)
Berbeda dengan Optimistic Lock, fitur ini memblokir row di database PostgreSQL menggunakan query raw SQL `SELECT ... FOR UPDATE` (atau variasinya) di dalam transaksi `tx`.
*   **Validasi Startup**: Saat bootstrap aplikasi, konfigurasi `lock` divalidasi silang secara ketat terhadap file [schema.prisma](file:///home/fikiap23/sasana/kalventis/boilerplate-nest/prisma/schema.prisma). Jika ada kolom dengan dekorator `@map` di database yang tidak didefinisikan pemetaannya di opsi `columns`, aplikasi akan gagal start dan memunculkan error konfigurasi.
*   **Lock Mode**:
    *   `noKeyUpdate` (default): `FOR NO KEY UPDATE` - Mengunci baris data tetapi memperbolehkan update foreign key lain. Cocok untuk update field biasa (misal stok, status, balance).
    *   `update`: `FOR UPDATE` - Kunci penuh baris data termasuk relasi foreign key.
    *   `share`: `FOR SHARE` - Kunci read-only bersama transaksi lain.
    *   `keyShare`: `FOR KEY SHARE` - Kunci teringan untuk relasi foreign key.
*   **Penting**: Penggunaan lock wajib disertai parameter transaksi `tx` dan secara otomatis mem-bypass caching.

### D. Relasi Virtual / Automated Compose Helper
Karena repository menggunakan cache, relasi database kompleks (`include` atau `select` relasi pada Prisma) akan sangat menyulitkan invalidasi cache secara granular.
*   **Solusi**: Repositori membagi query select menggunakan utilitas `splitSelect`. Field database scalar biasa ditarik dari database/cache model bersangkutan, sedangkan field relasi ditarik melalui repository/helper-nya masing-masing secara paralel dan digabungkan di memori via helper yang meng-extend `BaseComposeHelper`.
*   Hal ini memastikan caching tetap bekerja sangat cepat pada layer entitas individual dan relasi tetap bisa ter-resolve dengan efisien.

---

## 4. Contoh Use Case Lengkap

Mari kita buat contoh implementasi fiktif terintegrasi untuk entitas **Produk** yang dimiliki oleh **Merchant** (toko) dan dikelompokkan berdasarkan **Kategori**.

### 📄 Skema Prisma (`prisma/schema.prisma`)
```prisma
model Merchant {
  id        String    @id @default(uuid())
  name      String
  products  Product[]

  @@map("merchants")
}

model Category {
  id        String    @id @default(uuid())
  name      String
  products  Product[]

  @@map("categories")
}

model Product {
  id          String   @id @default(uuid())
  name        String
  price       Decimal  @db.Decimal(12, 2)
  stock       Int
  merchantId  String   @map("merchant_id")
  categoryId  String   @map("category_id")
  createdAt   DateTime @default(now()) @map("created_at")
  updatedAt   DateTime @updatedAt @map("updated_at")

  merchant    Merchant @relation(fields: [merchantId], references: [id])
  category    Category @relation(fields: [categoryId], references: [id])

  @@map("products")
}
```

### Registry Prisma (`prisma-select-payload.type.ts`)
Setiap kali mengaktifkan cache pada repository baru, model tersebut **wajib** diregistrasikan ke tipe select payload di [prisma-select-payload.type.ts](file:///home/fikiap23/sasana/kalventis/boilerplate-nest/src/infrastructure/prisma/types/prisma-select-payload.type.ts) agar TypeScript dapat mendeteksi properti select yang valid:

```typescript
export const PRISMA_SELECT_PAYLOAD_MODEL_KEYS = [
  'admin',
  'merchant',
  'category',
  'product', // <--- Daftarkan model runtime key di sini
] as const;

export interface PrismaSelectPayloadMap {
  admin: Prisma.AdminSelect;
  merchant: Prisma.MerchantSelect;
  category: Prisma.CategorySelect;
  product: Prisma.ProductSelect; // <--- Daftarkan tipe data Prisma select
}
```

---

### Use Case 1: CRUD & Caching Dasar (Product Repository)
Kita membuat repository untuk `Product` dengan caching Redis diaktifkan.

```typescript
// src/modules/product/repositories/product.repository.ts
import { forwardRef } from '@nestjs/common';
import { Prisma } from 'src/infrastructure/prisma/prisma-client';
import {
  createPrismaRepository,
  PrismaRepositoryInstance,
} from 'src/infrastructure/prisma/create-prisma.repository';
import { ProductComposeHelper } from '../helpers/product-compose.helper';

export type ProductPayload<T extends Prisma.ProductSelect> =
  Prisma.ProductGetPayload<{ select: T }>;

type ProductToPayload = <T extends Prisma.ProductSelect>(
  data: unknown,
) => ProductPayload<T>;

export const ProductRepository = createPrismaRepository<
  Prisma.ProductSelect,
  Prisma.ProductCreateInput,
  Prisma.ProductUpdateInput,
  Prisma.ProductWhereInput,
  Prisma.ProductOrderByWithRelationInput,
  ProductToPayload,
  'product'
>({
  model: 'product',
  cache: {
    ttl: 60 * 60, // Cache selama 1 jam
    nullTtl: 30,  // Cache data kosong selama 30 detik
    sensitiveFields: [], // Kosongkan jika tidak ada field sensitif
    methods: {
      getManyPaginate: { ttl: 60 * 5 }, // List berhalaman cukup di-cache 5 menit
    },
  },
  getDelegate: (client) => client.product,
  toPayload: <T extends Prisma.ProductSelect>(data: unknown) =>
    data as ProductPayload<T>,
  scalarFields: Prisma.ProductScalarFieldEnum,
  composeHelperToken: forwardRef(() => ProductComposeHelper),
});

export type ProductRepository = PrismaRepositoryInstance<
  Prisma.ProductSelect,
  Prisma.ProductCreateInput,
  Prisma.ProductUpdateInput,
  Prisma.ProductWhereInput,
  Prisma.ProductOrderByWithRelationInput,
  ProductToPayload,
  'product'
>;
```

---

### Use Case 2: Multi-Tenant & Cache Tagging
Dalam sistem multi-tenant, menghapus *semua* cache query list saat ada penambahan produk baru di salah satu Merchant sangat tidak efisien (menghancurkan cache Merchant lain). Kita mengatasinya dengan cache tagging berbasis `merchantId`.

1.  **Daftarkan Tag di Utilitas Cache Tag**
    Definisikan struktur tag terpusat di `src/common/utils/cache-tag.util.ts`:
    ```typescript
    export const CacheTags = {
      merchant: (merchantId: unknown): string[] =>
        typeof merchantId === 'string' ? [`merchant:${merchantId}`] : [],
    };
    ```

2.  **Konfigurasi Dynamic Tags di Repository**
    Tambahkan fungsi `getTags` di konfigurasi cache repositori:
    ```typescript
    // Di dalam createPrismaRepository options ProductRepository:
    cache: {
      ttl: 60 * 60,
      getTags: (product: any) => CacheTags.merchant(product.merchantId),
    }
    ```
    *   **Saat Read (`getMany`/`getManyPaginate`)**: Jika service mengirim filter `where: { merchantId: 'merchant-abc' }`, repositori secara otomatis me-resolve tag `['merchant:merchant-abc']` dan menyimpannya di Redis di bawah index tag tersebut.
    *   **Saat Write (`create`/`updateById`/`deleteById`)**: Repositori mengekstrak `merchantId` dari record hasil database dan otomatis memicu penghapusan query hanya untuk tag `['merchant:merchant-abc']` (menjaga cache merchant lain tetap aman).

3.  **Penggunaan di Service Layer**
    ```typescript
    // src/modules/product/services/product.service.ts
    import { Injectable, HttpStatus } from '@nestjs/common';
    import { ProductRepository } from '../repositories/product.repository';
    import { CreateProductDto } from '../dto/product.dto';
    import { CacheTags } from 'src/common/utils/cache-tag.util';

    @Injectable()
    export class ProductService {
      constructor(private readonly productRepository: ProductRepository) {}

      // Mendapatkan list produk per merchant (Akan di-cache & di-tag per merchant)
      async handleGetProductsByMerchant(merchantId: string, page = 1, limit = 10) {
        return this.productRepository.getManyPaginate({
          where: { merchantId },
          select: { id: true, name: true, price: true },
          page,
          limit,
          setCache: true, // AKTIFKAN CACHE
        });
      }

      // Simpan produk baru (Otomatis invalidasi cache merchant terkait)
      async handleCreateProduct(dto: CreateProductDto) {
        return this.productRepository.create({
          data: dto,
          // Tags untuk write wajib dikirim (bisa berupa callback/array langsung)
          tags: (result) => CacheTags.merchant(result.merchantId), 
        });
      }
    }
    ```

---

### Use Case 3: Pessimistic Row Locking (SELECT FOR UPDATE)
Skenario pengurangan stok produk saat pesanan dibuat. Kita harus mencegah balapan kondisi (race condition) ketika stok dibeli oleh dua transaksi secara bersamaan.

1.  **Konfigurasi Lock di Repository**
    Tabel database `products` memetakan properti `createdAt` ke `created_at` dan `updatedAt` ke `updated_at`. Pemetaan ini didaftarkan di config `lock.columns` (wajib dideklarasikan semua field scalar yang memiliki anotasi `@map` di schema.prisma).
    ```typescript
    // Di dalam createPrismaRepository options ProductRepository:
    lock: {
      tableName: 'products', // Nama tabel asli dari @@map
      columns: {
        createdAt: 'created_at',
        updatedAt: 'updated_at',
      },
    }
    ```

2.  **Pemanggilan Lock di Service Layer**
    Operasi lock wajib berjalan di dalam transaksi (`tx`).
    ```typescript
    // src/modules/product/services/product.service.ts
    import { Injectable, HttpStatus } from '@nestjs/common';
    import { PrismaService } from 'src/infrastructure/prisma/prisma.service';
    import { ProductRepository } from '../repositories/product.repository';
    import { CustomError } from 'src/common/exceptions/custom-error';

    @Injectable()
    export class ProductService {
      constructor(
        private readonly prisma: PrismaService,
        private readonly productRepository: ProductRepository,
      ) {}

      async handleDeductStock(productId: string, quantity: number) {
        return this.prisma.execTx(
          // 1. Jalankan di dalam transaksi (tx)
          async (tx) => {
            // 2. Baca produk dengan lock (menunggu transaksi lain commit/rollback)
            const product = await this.productRepository.getThrowById({
              tx,
              id: productId,
              select: { id: true, stock: true },
              lock: { mode: 'noKeyUpdate' }, // Kunci baris produk
            });

            if (product.stock < quantity) {
              throw new CustomError({
                statusCode: HttpStatus.BAD_REQUEST,
                message: 'Stok tidak mencukupi',
              });
            }

            // 3. Update stok
            const updated = await this.productRepository.updateById({
              tx,
              id: productId,
              data: { stock: product.stock - quantity },
              invalidate: 'none', // skip invalidasi di dalam tx
              tags: null,
            });

            return updated;
          },
          // 4. Callback afterCommit - Hapus cache setelah transaksi berhasil
          async () => {
            await this.productRepository.invalidateCache({ id: productId });
          }
        );
      }
    }
    ```

---

### Use Case 4: Virtual Relation Composition (`BaseComposeHelper`)
Mendapatkan produk beserta kategori dan data merchant secara terpisah (decoupled query) alih-alih `join` database langsung menggunakan Prisma.

1.  **Buat Compose Helper**
    Buat helper `@Injectable` untuk menyatukan relasi:
    ```typescript
    // src/modules/product/helpers/product-compose.helper.ts
    import { Injectable } from '@nestjs/common';
    import { BaseComposeHelper } from 'src/common/utils/base-compose.helper';
    import { CategoryRepository } from 'src/modules/master-data/repositories/category.repository';
    import { MerchantRepository } from 'src/modules/merchant/repositories/merchant.repository';

    @Injectable()
    export class ProductComposeHelper extends BaseComposeHelper {
      constructor(
        private readonly categoryRepository: CategoryRepository,
        private readonly merchantRepository: MerchantRepository,
      ) {
        // Daftarkan relasi virtual beserta repositorinya
        super({
          category: {
            repository: categoryRepository,
            type: 'one', // satu kategori per produk
            foreignKey: 'categoryId',
          },
          merchant: {
            repository: merchantRepository,
            type: 'one', // satu merchant per produk
            foreignKey: 'merchantId',
          },
        });
      }
    }
    ```

2.  **Registrasikan di Module Providers**
    ```typescript
    // src/modules/product/product.module.ts
    import { Module, forwardRef } from '@nestjs/common';
    import { ProductService } from './services/product.service';
    import { ProductRepository } from './repositories/product.repository';
    import { ProductComposeHelper } from './helpers/product-compose.helper';
    import { MasterDataModule } from '../master-data/master-data.module';
    import { MerchantModule } from '../merchant/merchant.module';

    @Module({
      imports: [
        forwardRef(() => MasterDataModule),
        forwardRef(() => MerchantModule),
      ],
      providers: [ProductService, ProductRepository, ProductComposeHelper],
      exports: [ProductService, ProductRepository],
    })
    export class ProductModule {}
    ```

3.  **Penggunaan di Service Layer**
    Service cukup menggunakan select preset general/detail biasa. Pemecahan select dan stitching relasi berjalan di balik layar secara transparan!
    ```typescript
    // src/modules/product/services/product.service.ts
    async handleGetProductDetail(id: string) {
      return this.productRepository.getThrowById({
        id,
        select: {
          id: true,
          name: true,
          price: true,
          category: { select: { id: true, name: true } }, // relasi category
          merchant: { select: { id: true, name: true } }, // relasi merchant
        },
        setCache: true, // Data produk yang ter-compose juga akan tersimpan di cache
      });
    }
    ```

---

### Use Case 5: Integrasi Transaksi DB & Invalidasi Manual (`execTx`)
Sistem caching tidak berjalan (di-bypass) di dalam transaksi database. Saat melakukan modifikasi data secara massal atau bertingkat di dalam transaksi, invalidasi cache wajib ditunda hingga transaksi berhasil di-commit menggunakan parameter `afterCommit` pada `execTx`.

```typescript
// src/modules/product/services/product.service.ts
async handleBulkUpdatePrice(merchantId: string, discountRate: number) {
  // Ambil list id produk yang akan di-update (bypass cache)
  const products = await this.productRepository.getMany({
    where: { merchantId },
    select: { id: true },
  });

  const productIds = products.map((p) => p.id);

  return this.prisma.execTx(
    async (tx) => {
      for (const id of productIds) {
        await this.productRepository.updateById({
          tx,
          id,
          data: { price: { multiply: discountRate } },
          invalidate: 'none', // Skip otomatis invalidasi agar tidak menembak Redis di dalam tx
          tags: null,
        });
      }
    },
    // afterCommit berjalan hanya setelah transaksi database berhasil dicommit ke PG
    async () => {
      // Bersihkan cache entity satu per satu secara paralel di Redis
      await Promise.all(
        productIds.map((id) => this.productRepository.invalidateCache({ id }))
      );
    }
  );
}
```

---

## 5. Ringkasan Aturan & Best Practices

1.  **Bypass Cache untuk Transaksi & Autentikasi**: Jangan pernah memberikan opsi `setCache: true` untuk pencarian password (auth), pengecekan unik data email/slug pada write path, dan saat melakukan read di dalam blok transaksi (`tx`).
2.  **Metadata Update**: Gunakan parameter `invalidate: 'none'` untuk memperbarui data frekuensi tinggi yang tidak memengaruhi visual API (contoh: `lastLoginAt`, `readCount`, `lastUpdatedAt`).
3.  **Daftarkan di `PrismaSelectPayloadMap`**: Seluruh model repositori baru yang memiliki konfigurasi cache harus didaftarkan di [prisma-select-payload.type.ts](file:///home/fikiap23/sasana/kalventis/boilerplate-nest/src/infrastructure/prisma/types/prisma-select-payload.type.ts) agar kompilasi TypeScript berjalan sukses.
4.  **Row Lock Config**: Pastikan semua nama kolom fisik database yang menggunakan `@map(...)` di `schema.prisma` terdefinisi persis pada konfigurasi `lock.columns` repositori agar tidak memicu error startup validasi.
5.  **Gunakan CLI Generator (Sangat Direkomendasikan)**: Untuk mempercepat pembuatan modul baru, gunakan perintah `yarn gen:module <nama_modul> --cache` yang otomatis men-generate modul, controller, service, helper, dto, tipe select, registrasi payload map, serta repositori dengan konfigurasi cache dasar.
