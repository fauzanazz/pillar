import z from 'zod';

export const registerFormSchema = z.object({
  address: z.string().min(1, {
    message: 'Alamat harus diisi.',
  }),
  ownerName: z.string().min(1, {
    message: 'Nama pemilik harus diisi.',
  }),
  storeName: z.string().min(1, {
    message: 'Nama toko harus diisi.',
  }),
  businessId: z.string().min(1, {
    message: 'Nomor Induk Berusaha harus diisi.',
  }),
  businessType: z.enum(
    ['produsen_bahan_baku', 'produsen_barang_jadi', 'distributor'],
    {
      message: 'Jenis usaha harus dipilih.',
    },
  ),
  city: z.string().min(1, {
    message: 'Kota harus diisi.',
  }),
  province: z.string().min(1, {
    message: 'Provinsi harus diisi.',
  }),
  phoneNumber: z.string().min(1, {
    message: 'Nomor telepon harus diisi.',
  }),
  email: z.string().email({
    message: 'Alamat email tidak valid.',
  }),
  password: z.string().min(6, {
    message: 'Password harus minimal 6 karakter.',
  }),
  confirmPassword: z.string().min(6, {
    message: 'Konfirmasi password harus minimal 6 karakter.',
  }),
});

export type RegisterFormType = z.infer<typeof registerFormSchema>;
