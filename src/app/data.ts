export const menuSeed = [
  {
    id: 1,
    name: "Nasi Goreng",
    category: "Makanan Utama",
    hpp: 12500,
    weight: 320,
    status: "Aktif",
  },
  {
    id: 2,
    name: "Ayam Geprek",
    category: "Makanan Utama",
    hpp: 14500,
    weight: 350,
    status: "Aktif",
  },
  {
    id: 3,
    name: "Mie Goreng",
    category: "Makanan Utama",
    hpp: 10500,
    weight: 280,
    status: "Aktif",
  },
  { id: 4, name: "Nasi Ayam", category: "Makanan Utama", hpp: 13500, weight: 340, status: "Aktif" },
  { id: 5, name: "Es Teh Manis", category: "Minuman", hpp: 2500, weight: 300, status: "Aktif" },
  { id: 6, name: "Pisang Goreng", category: "Camilan", hpp: 4500, weight: 120, status: "Nonaktif" },
];

const daily = [
  ["2025-11-12", 58, 51, 7],
  ["2025-11-13", 62, 57, 5],
  ["2025-11-14", 67, 63, 4],
  ["2025-11-15", 75, 71, 4],
  ["2025-11-16", 70, 65, 5],
  ["2025-11-17", 64, 60, 4],
  ["2025-11-18", 68, 63, 5],
  ["2025-11-19", 72, 67, 5],
  ["2025-11-20", 69, 66, 3],
  ["2025-11-21", 76, 71, 5],
  ["2025-11-22", 82, 78, 4],
  ["2025-11-23", 74, 69, 5],
  ["2025-11-24", 70, 67, 3],
  ["2025-11-25", 73, 69, 4],
];

export const recordSeed = daily.flatMap(([date, production, sold, leftover], day) =>
  menuSeed.slice(0, 5).map((menu, index) => {
    const factor = [1, 0.82, 0.68, 0.76, 1.25][index];
    const p = Math.round(Number(production) * factor);
    const s = Math.min(p, Math.round(Number(sold) * factor) - ((day + index) % 2));
    return {
      id: `${date}-${menu.id}`,
      date: String(date),
      menuId: menu.id,
      menu: menu.name,
      production: p,
      sold: Math.max(0, s),
      leftover: Math.max(0, p - s),
      loss: Math.max(0, p - s) * menu.hpp,
    };
  }),
);

export const categorySeed = [
  {
    id: 1,
    name: "Makanan Utama",
    description: "Hidangan utama dan makanan berat",
    menuCount: 4,
    status: "Aktif",
  },
  {
    id: 2,
    name: "Minuman",
    description: "Minuman dingin dan hangat",
    menuCount: 1,
    status: "Aktif",
  },
  {
    id: 3,
    name: "Camilan",
    description: "Makanan ringan dan pendamping",
    menuCount: 1,
    status: "Aktif",
  },
  {
    id: 4,
    name: "Pencuci Mulut",
    description: "Hidangan manis setelah makan",
    menuCount: 0,
    status: "Aktif",
  },
];

export const emissionSeed = [
  {
    id: 1,
    category: "Makanan Utama",
    factor: "Belum dikonfigurasi",
    unit: "kg CO₂e/kg",
    source: "Referensi akan ditambahkan",
    updated: "18/11/2025",
  },
  {
    id: 2,
    category: "Minuman",
    factor: "Belum dikonfigurasi",
    unit: "kg CO₂e/kg",
    source: "Referensi akan ditambahkan",
    updated: "18/11/2025",
  },
  {
    id: 3,
    category: "Camilan",
    factor: "Belum dikonfigurasi",
    unit: "kg CO₂e/kg",
    source: "Referensi akan ditambahkan",
    updated: "18/11/2025",
  },
];

export const formatRp = (value: number) =>
  new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    maximumFractionDigits: 0,
  }).format(value);

export const formatDate = (value: string | Date) =>
  new Intl.DateTimeFormat("id-ID", { day: "2-digit", month: "2-digit", year: "numeric" }).format(
    new Date(value),
  );

export const shortDate = (value: string) =>
  new Intl.DateTimeFormat("id-ID", { day: "2-digit", month: "short" }).format(new Date(value));

export const chartData = daily.map(([date, production, sold, leftover]) => ({
  date: shortDate(String(date)),
  production,
  sold,
  leftover,
}));
