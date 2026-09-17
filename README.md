# mnurjaman-portfolio

## Menjalankan website

Gunakan Node.js 22 atau lebih baru karena project memakai SQLite bawaan Node.js.

```bash
npm start
```

Buka `http://localhost:3000`. File `portfolio.db` akan dibuat otomatis pada
start pertama dan diabaikan oleh Git.

## Mengubah project

Semua project dibaca dari tabel `projects` di SQLite. Homepage mengambil project
dengan `featured = 1`, sedangkan `portfolio.html` menampilkan seluruh project.
Edit database menggunakan aplikasi SQLite seperti DB Browser for SQLite, atau
jalankan SQL berikut dari Node.js:

```sql
UPDATE projects
SET title = 'Judul baru', description = 'Deskripsi baru'
WHERE slug = 'backend-api';
```

Kolom penting: `slug`, `title`, `category`, `category_label`, `description`,
`detail`, `technologies` (JSON array), `icon`, `accent`, `image_url`,
`project_url` (opsional), `featured`, dan `sort_order`.

Untuk menambahkan link project:

```sql
UPDATE projects
SET project_url = 'https://github.com/username/nama-project'
WHERE slug = 'backend-api';
```
