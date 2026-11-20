
import { useEffect, useMemo, useState } from "react";
import { supabase } from "../lib/supabase";
import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Legend,
  Line,
  LineChart,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import {
  AlertCircle,
  ArrowDownRight,
  ArrowUpRight,
  BarChart3,
  CalendarDays,
  Check,
  ChevronRight,
  CircleDollarSign,
  ClipboardCheck,
  Download,
  Edit3,
  Factory,
  FileSpreadsheet,
  Info,
  Leaf,
  Lightbulb,
  PackageCheck,
  Plus,
  Search,
  ShoppingBag,
  Sparkles,
  Trash2,
  TrendingDown,
  TrendingUp,
  UtensilsCrossed,
  Weight,
  X,
  Tags,
  ShieldCheck,
} from "lucide-react";
import { useApp } from "./state";
import { chartData, formatDate, formatRp, shortDate } from "./data";
import {
  Badge,
  Button,
  Card,
  DataTable,
  EmptyState,
  Input,
  MetricCard,
  Modal,
  PageHeader,
  SectionTitle,
  Select,
} from "./ui";

const tooltipStyle = {
  border: "1px solid var(--border)",
  borderRadius: 10,
  boxShadow: "var(--shadow-md)",
  fontSize: 12,
};


export function Dashboard() {
  const {
    profile,
    profileLoading,
    notify,
  } = useApp();

  const [period, setPeriod] = useState("7");
  const [dashboardRecords, setDashboardRecords] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // Mengambil tanggal lokal dalam format YYYY-MM-DD
  const getLocalDate = (date: Date) => {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, "0");
    const day = String(date.getDate()).padStart(2, "0");
    return `${year}-${month}-${day}`;
  };

  const todayDate = new Date();
  const todayString = getLocalDate(todayDate);

  const getDateOffset = (offset: number) => {
    const date = new Date(todayDate);
    date.setDate(date.getDate() + offset);
    return getLocalDate(date);
  };

  const startDate = getDateOffset(-29);

  // Mengambil data produksi dari Supabase
  useEffect(() => {
    const fetchDashboard = async () => {
      if (profileLoading) return;

      if (!profile) {
        setDashboardRecords([]);
        setLoading(false);
        return;
      }

      setLoading(true);

      const { data, error } = await supabase
        .from("catatan_harian")
        .select(`
          id_catatan,
          tanggal,
          jumlah_produksi,
          jumlah_terjual,
          jumlah_sisa,
          menu!inner (
            id_menu,
            nama_menu,
            hpp_per_porsi,
            id_pengguna
          )
        `)
        .eq("menu.id_pengguna", profile.id_pengguna)
        .gte("tanggal", startDate)
        .lte("tanggal", todayString)
        .order("tanggal", { ascending: false });

      if (error) {
        console.error("Gagal mengambil data dashboard:", error);
        notify("Gagal memuat data dashboard.");
        setDashboardRecords([]);
      } else {
        const mappedRecords = (data || []).map((item: any) => {
          const menu = Array.isArray(item.menu)
            ? item.menu[0]
            : item.menu;

          const production = Number(item.jumlah_produksi || 0);
          const sold = Number(item.jumlah_terjual || 0);
          const leftover = Number(item.jumlah_sisa || 0);
          const hpp = Number(menu?.hpp_per_porsi || 0);

          return {
            id: item.id_catatan,
            date: item.tanggal,
            menu: menu?.nama_menu || "Menu tidak diketahui",
            production,
            sold,
            leftover,
            loss: leftover * hpp,
          };
        });

        setDashboardRecords(mappedRecords);
      }

      setLoading(false);
    };

    fetchDashboard();
  }, [profile?.id_pengguna, profileLoading]);

  const today = dashboardRecords.filter(
    (r) => r.date === todayString
  );

  const yesterday = dashboardRecords.filter(
    (r) => r.date === getDateOffset(-1)
  );

  const total = (data: any[], key: string) =>
    data.reduce((sum, record) => sum + record[key], 0);

  const productionTotal = total(today, "production");
  const soldTotal = total(today, "sold");
  const leftoverTotal = total(today, "leftover");
  const lossTotal = total(today, "loss");

  const yesterdayProduction = total(yesterday, "production");
  const yesterdayLeftover = total(yesterday, "leftover");

  const salesRate = productionTotal > 0
    ? Math.round((soldTotal / productionTotal) * 100)
    : 0;

  const productionHelper =
    yesterdayProduction > 0
      ? `${productionTotal >= yesterdayProduction ? "+" : ""}${(
          ((productionTotal - yesterdayProduction) /
            yesterdayProduction) *
          100
        ).toFixed(1)}% dari kemarin`
      : "Belum ada data kemarin";

  const leftoverHelper =
    leftoverTotal === yesterdayLeftover
      ? "Sama dengan kemarin"
      : leftoverTotal < yesterdayLeftover
      ? `${yesterdayLeftover - leftoverTotal} porsi lebih rendah`
      : `${leftoverTotal - yesterdayLeftover} porsi lebih tinggi`;

  // Menu paling laris hari ini
  const top = today
    .slice()
    .sort((a, b) => b.sold - a.sold)
    .slice(0, 4);

  // Menu dengan sisa terbanyak hari ini
  const leftovers = today
    .slice()
    .sort((a, b) => b.leftover - a.leftover)
    .slice(0, 4);

  // Membuat data grafik 30 hari terakhir
  const chartRows = Array.from({ length: 30 }, (_, index) => {
    const date = getDateOffset(index - 29);

    const recordsOnDate = dashboardRecords.filter(
      (r) => r.date === date
    );

    return {
      date: shortDate(date),
      production: total(recordsOnDate, "production"),
      sold: total(recordsOnDate, "sold"),
    };
  });

  const displayedChart = period === "7"
    ? chartRows.slice(-7)
    : chartRows;

  // Rekomendasi sederhana berdasarkan rata-rata penjualan
  // tujuh hari terakhir
  const lastSevenDays = dashboardRecords.filter(
    (r) => r.date >= getDateOffset(-6) && r.date <= todayString
  );

  const salesByMenu = lastSevenDays.reduce(
    (result: any, record) => {
      if (!result[record.menu]) {
        result[record.menu] = 0;
      }

      result[record.menu] += record.sold;
      return result;
    },
    {}
  );

  const recommendedMenu = Object.entries(salesByMenu)
    .sort((a: any, b: any) => b[1] - a[1])[0];

  const recommendedAverage = recommendedMenu
    ? Math.round(Number(recommendedMenu[1]) / 7)
    : 0;

  const latestRecords = today.slice(0, 5);

  if (profileLoading || loading) {
    return (
      <div className="page">
        <p>Memuat dashboard...</p>
      </div>
    );
  }

  return (
    <div className="page">
      <div className="welcome-row">
        <div>
          <p>
            Selamat datang kembali, {profile?.nama_usaha || "Pengguna"}
          </p>
          <h1>Ringkasan bisnis hari ini</h1>
          <span>
            {profile?.nama_usaha || "Usaha Anda"} ·{" "}
            {todayDate.toLocaleDateString("id-ID", {
              weekday: "long",
              day: "numeric",
              month: "long",
              year: "numeric",
            })}
          </span>
        </div>

        <Button
          icon={Plus}
          onClick={() => location.assign("/produksi")}
        >
          Catat produksi
        </Button>
      </div>

      <div className="metrics-grid">
        <MetricCard
          label="Produksi hari ini"
          value={`${productionTotal} porsi`}
          helper={productionHelper}
          icon={Factory}
        />

        <MetricCard
          label="Terjual hari ini"
          value={`${soldTotal} porsi`}
          helper={`${salesRate}% tingkat penjualan`}
          icon={ShoppingBag}
          tone="sage"
        />

        <MetricCard
          label="Sisa makanan"
          value={`${leftoverTotal} porsi`}
          helper={leftoverHelper}
          icon={PackageCheck}
          tone="mustard"
        />

        <MetricCard
          label="Estimasi kerugian bahan"
          value={formatRp(lossTotal)}
          helper="Berdasarkan HPP dan jumlah sisa"
          icon={CircleDollarSign}
          tone="red"
        />
      </div>

      <div className="dashboard-grid">
        <Card className="chart-card span-2">
          <SectionTitle
            title="Tren produksi & penjualan"
            subtitle="Perbandingan jumlah porsi yang diproduksi dan terjual"
            action={
              <div className="segmented">
                <button
                  className={period === "7" ? "active" : ""}
                  onClick={() => setPeriod("7")}
                >
                  7 hari
                </button>
                <button
                  className={period === "30" ? "active" : ""}
                  onClick={() => setPeriod("30")}
                >
                  30 hari
                </button>
              </div>
            }
          />

          <div className="chart-height">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={displayedChart}>
                <defs>
                  <linearGradient
                    id="prod"
                    x1="0"
                    y1="0"
                    x2="0"
                    y2="1"
                  >
                    <stop
                      offset="0%"
                      stopColor="#174C3C"
                      stopOpacity={0.18}
                    />
                    <stop
                      offset="100%"
                      stopColor="#174C3C"
                      stopOpacity={0}
                    />
                  </linearGradient>
                </defs>

                <CartesianGrid
                  strokeDasharray="3 3"
                  vertical={false}
                  stroke="#E7E9E3"
                />

                <XAxis
                  dataKey="date"
                  tickLine={false}
                  axisLine={false}
                />

                <YAxis
                  tickLine={false}
                  axisLine={false}
                />

                <Tooltip contentStyle={tooltipStyle} />
                <Legend iconType="circle" />

                <Area
                  type="monotone"
                  dataKey="production"
                  name="Produksi"
                  stroke="#174C3C"
                  fill="url(#prod)"
                  strokeWidth={2}
                />

                <Line
                  type="monotone"
                  dataKey="sold"
                  name="Terjual"
                  stroke="#D9A441"
                  strokeWidth={2.5}
                  dot={false}
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </Card>

        <Card className="recommend-card">
          <div className="recommend-icon">
            <Sparkles size={21} />
          </div>

          <Badge tone="warning">REKOMENDASI BESOK</Badge>

          {recommendedMenu ? (
            <>
              <h2>
                Siapkan sekitar{" "}
                <strong>{recommendedAverage} porsi</strong>{" "}
                {recommendedMenu[0]}
              </h2>

              <p>
                Berdasarkan rata-rata penjualan tujuh hari terakhir.
              </p>

              <div className="recommend-meta">
                <span>
                  <TrendingUp size={16} />
                  Rata-rata {recommendedAverage} porsi
                </span>
                <span>Moving Average</span>
              </div>
            </>
          ) : (
            <>
              <h2>Belum ada rekomendasi produksi</h2>
              <p>
                Tambahkan catatan produksi untuk mendapatkan estimasi
                kebutuhan menu.
              </p>
            </>
          )}

          <Button
            variant="secondary"
            onClick={() => location.assign("/rekomendasi")}
          >
            Lihat semua rekomendasi <ChevronRight size={16} />
          </Button>
        </Card>

        <Card>
          <SectionTitle
            title="Menu paling laris"
            subtitle="Penjualan hari ini"
          />

          <div className="rank-list">
            {top.length > 0 ? (
              top.map((r: any, i: number) => (
                <div key={r.id}>
                  <span className="rank">{i + 1}</span>

                  <div>
                    <strong>{r.menu}</strong>
                    <small>{r.sold} porsi terjual</small>
                  </div>

                  <Badge>
                    {r.production > 0
                      ? Math.round((r.sold / r.production) * 100)
                      : 0}%
                  </Badge>
                </div>
              ))
            ) : (
              <p>Belum ada penjualan hari ini.</p>
            )}
          </div>
        </Card>

        <Card>
          <SectionTitle
            title="Sisa tertinggi"
            subtitle="Perlu perhatian hari ini"
          />

          <div className="rank-list">
            {leftovers.length > 0 ? (
              leftovers.map((r: any) => (
                <div key={r.id}>
                  <span className="food-icon">
                    <UtensilsCrossed size={16} />
                  </span>

                  <div>
                    <strong>{r.menu}</strong>
                    <small>
                      {r.leftover} porsi · {formatRp(r.loss)}
                    </small>
                  </div>

                  <TrendingDown
                    className="danger-text"
                    size={18}
                  />
                </div>
              ))
            ) : (
              <p>Belum ada data sisa makanan hari ini.</p>
            )}
          </div>
        </Card>

        <Card className="span-2">
          <SectionTitle
            title="Catatan produksi terbaru"
            subtitle="Data yang baru ditambahkan hari ini"
            action={
              <Button
                variant="ghost"
                onClick={() => location.assign("/produksi")}
              >
                Lihat semua <ChevronRight size={16} />
              </Button>
            }
          />

          <DataTable
            headers={["Menu", "Produksi", "Terjual", "Sisa", "Status"]}
          >
            {latestRecords.length > 0 ? (
              latestRecords.map((r: any) => (
                <tr key={r.id}>
                  <td>
                    <strong>{r.menu}</strong>
                  </td>
                  <td>{r.production} porsi</td>
                  <td>{r.sold} porsi</td>
                  <td>{r.leftover} porsi</td>
                  <td>
                    <Badge
                      tone={r.leftover <= 5 ? "success" : "warning"}
                    >
                      {r.leftover <= 5
                        ? "Efisien"
                        : "Perlu ditinjau"}
                    </Badge>
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan={5}>
                  Belum ada catatan produksi hari ini.
                </td>
              </tr>
            )}
          </DataTable>
        </Card>
      </div>

      <p className="demo-note">
        <Info size={14} /> Data dashboard diambil dari catatan produksi
        dan profil usaha yang tersimpan di database.
      </p>
    </div>
  );
}

export function MenuManagement() {
  const {
    menus,
    setMenus,
    categories,
    setCategories,
    notify,
    profile,
    profileLoading,
  } = useApp();

  const [search, setSearch] = useState("");
  const [category, setCategory] = useState("Semua");
  const [editing, setEditing] = useState<any>(null);
  const [deleting, setDeleting] = useState<any>(null);
  const [errors, setErrors] = useState<any>({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  // Mengambil kategori dan menu dari Supabase
  useEffect(() => {
    if (profileLoading) return;

    if (!profile) {
      setMenus([]);
      setCategories([]);
      setLoading(false);
      return;
    }

    let isMounted = true;

    const fetchMenus = async () => {
      setLoading(true);

      const { data: categoryData, error: categoryError } = await supabase
        .from("kategori_makanan")
        .select("id_kategori, nama_kategori")
        .order("id_kategori");

      if (!isMounted) return;

      if (categoryError) {
        console.error("Gagal mengambil kategori:", categoryError);
        notify("Gagal mengambil kategori: " + categoryError.message);
        setLoading(false);
        return;
      }

      const mappedCategories = (categoryData || []).map((c: any) => ({
        id: c.id_kategori,
        name: c.nama_kategori,
        description: "",
        menuCount: 0,
        status: "Aktif",
      }));

      const { data: menuData, error: menuError } = await supabase
        .from("menu")
        .select(`
          id_menu,
          id_pengguna,
          id_kategori,
          nama_menu,
          hpp_per_porsi,
          berat_per_porsi_kg,
          aktif
        `)
        .eq("id_pengguna", profile.id_pengguna)
        .order("id_menu");

      if (!isMounted) return;

      if (menuError) {
        console.error("Gagal mengambil menu:", menuError);
        notify("Gagal mengambil menu: " + menuError.message);
        setMenus([]);
        setLoading(false);
        return;
      }

      const mappedMenus = (menuData || []).map((m: any) => {
        const selectedCategory = mappedCategories.find(
          (c: any) => c.id === m.id_kategori
        );

        return {
          id: m.id_menu,
          categoryId: m.id_kategori,
          name: m.nama_menu,
          category: selectedCategory?.name || "Kategori tidak ditemukan",
          hpp: Number(m.hpp_per_porsi),
          weight: Number(m.berat_per_porsi_kg) * 1000,
          status: m.aktif ? "Aktif" : "Nonaktif",
        };
      });

      const categoriesWithCount = mappedCategories.map((c: any) => ({
        ...c,
        menuCount: mappedMenus.filter(
          (m: any) => m.categoryId === c.id
        ).length,
      }));

      setCategories(categoriesWithCount);
      setMenus(mappedMenus);
      setLoading(false);
    };

    fetchMenus();

    return () => {
      isMounted = false;
    };
  }, [profileLoading, profile?.id_pengguna]);

  // Pencarian dan filter kategori
  const filtered = menus.filter(
    (m: any) =>
      m.name.toLowerCase().includes(search.toLowerCase()) &&
      (category === "Semua" || m.category === category)
  );

  // Tambah dan edit menu
  const save = async () => {
    if (!profile || saving) return;

    const next: any = {};

    if (!editing.name?.trim()) {
      next.name = "Nama menu wajib diisi.";
    }

    if (!editing.hpp || Number(editing.hpp) <= 0) {
      next.hpp = "HPP harus lebih dari 0.";
    }

    if (!editing.weight || Number(editing.weight) <= 0) {
      next.weight = "Berat harus lebih dari 0.";
    }

    const selectedCategory = categories.find(
      (c: any) => c.name === editing.category
    );

    if (!selectedCategory) {
      next.category = "Pilih kategori yang tersedia.";
    }

    if (Object.keys(next).length > 0) {
      setErrors(next);
      return;
    }

    setSaving(true);
    setErrors({});

    const menuData = {
      id_kategori: selectedCategory.id,
      nama_menu: editing.name.trim(),
      hpp_per_porsi: Number(editing.hpp),
      berat_per_porsi_kg: Number(editing.weight) / 1000,
      aktif: editing.status !== "Nonaktif",
    };

    let result;

    if (editing.id) {
      result = await supabase
        .from("menu")
        .update(menuData)
        .eq("id_menu", editing.id)
        .eq("id_pengguna", profile.id_pengguna)
        .select()
        .single();
    } else {
      result = await supabase
        .from("menu")
        .insert({
          ...menuData,
          id_pengguna: profile.id_pengguna,
        })
        .select()
        .single();
    }

    setSaving(false);

    if (result.error) {
      notify("Gagal menyimpan menu: " + result.error.message);
      return;
    }

    const savedMenu = {
      id: result.data.id_menu,
      categoryId: result.data.id_kategori,
      name: result.data.nama_menu,
      category: selectedCategory.name,
      hpp: Number(result.data.hpp_per_porsi),
      weight: Number(result.data.berat_per_porsi_kg) * 1000,
      status: result.data.aktif ? "Aktif" : "Nonaktif",
    };

    const updatedMenus = editing.id
      ? menus.map((m: any) =>
          m.id === editing.id ? savedMenu : m
        )
      : [...menus, savedMenu];

    setMenus(updatedMenus);

    setCategories(
      categories.map((c: any) => ({
        ...c,
        menuCount: updatedMenus.filter(
          (m: any) => m.categoryId === c.id
        ).length,
      }))
    );

    setEditing(null);
    setErrors({});

    notify(
      editing.id
        ? "Menu berhasil diperbarui."
        : "Menu baru berhasil ditambahkan."
    );
  };

  // Hapus menu
  const deleteMenu = async () => {
    if (!deleting || !profile) return;

    const { error } = await supabase
      .from("menu")
      .delete()
      .eq("id_menu", deleting.id)
      .eq("id_pengguna", profile.id_pengguna);

    if (error) {
      notify("Gagal menghapus menu: " + error.message);
      return;
    }

    const updatedMenus = menus.filter(
      (m: any) => m.id !== deleting.id
    );

    setMenus(updatedMenus);

    setCategories(
      categories.map((c: any) => ({
        ...c,
        menuCount: updatedMenus.filter(
          (m: any) => m.categoryId === c.id
        ).length,
      }))
    );

    setDeleting(null);
    notify("Menu berhasil dihapus.");
  };

  return (
    <div className="page">
      <PageHeader
        title="Kelola Menu"
        description="Atur menu, biaya bahan, dan ukuran porsi bisnis Anda."
        actions={
          <Button
            icon={Plus}
            onClick={() =>
              setEditing({
                name: "",
                category: categories[0]?.name || "",
                hpp: "",
                weight: "",
                status: "Aktif",
              })
            }
          >
            Tambah Menu
          </Button>
        }
      />

      <Card>
        <div className="toolbar">
          <label className="search-box">
            <Search size={18} />
            <input
              placeholder="Cari nama menu..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
            {search && (
              <button onClick={() => setSearch("")}>
                <X size={16} />
              </button>
            )}
          </label>

          <Select
            label=""
            value={category}
            onChange={(e: any) => setCategory(e.target.value)}
          >
            <option>Semua</option>
            {categories.map((c: any) => (
              <option key={c.id}>{c.name}</option>
            ))}
          </Select>

          <span className="result-count">
            {filtered.length} menu ditemukan
          </span>
        </div>

        {loading ? (
          <p className="muted">Memuat data menu...</p>
        ) : (
          <>
            <DataTable
              headers={[
                "Nama menu",
                "Kategori",
                "HPP / porsi",
                "Berat",
                "Status",
                "Aksi",
              ]}
            >
              {filtered.map((m: any) => (
                <tr key={m.id}>
                  <td>
                    <div className="menu-cell">
                      <span>
                        <UtensilsCrossed size={17} />
                      </span>
                      <strong>{m.name}</strong>
                    </div>
                  </td>
                  <td>{m.category}</td>
                  <td>
                    <strong>{formatRp(m.hpp)}</strong>
                  </td>
                  <td>{m.weight} gram</td>
                  <td>
                    <Badge
                      tone={m.status === "Aktif" ? "success" : "neutral"}
                    >
                      {m.status}
                    </Badge>
                  </td>
                  <td>
                    <div className="table-actions">
                      <button
                        onClick={() => setEditing({ ...m })}
                        aria-label={`Edit ${m.name}`}
                      >
                        <Edit3 size={17} />
                      </button>
                      <button
                        className="delete"
                        onClick={() => setDeleting(m)}
                        aria-label={`Hapus ${m.name}`}
                      >
                        <Trash2 size={17} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </DataTable>

            {!filtered.length && (
              <EmptyState
                icon={Search}
                title="Menu tidak ditemukan"
                text="Coba gunakan kata kunci atau kategori lain."
              />
            )}
          </>
        )}
      </Card>

      {editing && (
        <Modal
          title={editing.id ? "Edit Menu" : "Tambah Menu"}
          onClose={() => {
            setEditing(null);
            setErrors({});
          }}
          footer={
            <>
              <Button
                variant="secondary"
                onClick={() => {
                  setEditing(null);
                  setErrors({});
                }}
              >
                Batal
              </Button>
              <Button onClick={save} disabled={saving}>
                {saving ? "Menyimpan..." : "Simpan Menu"}
              </Button>
            </>
          }
        >
          <div className="form-grid">
            <Input
              label="Nama menu"
              placeholder="Contoh: Soto Ayam"
              value={editing.name}
              onChange={(e: any) =>
                setEditing({ ...editing, name: e.target.value })
              }
              error={errors.name}
            />

            <Select
              label="Kategori"
              value={editing.category}
              onChange={(e: any) =>
                setEditing({
                  ...editing,
                  category: e.target.value,
                })
              }
            >
              {categories.map((c: any) => (
                <option key={c.id}>{c.name}</option>
              ))}
            </Select>

            {errors.category && (
              <p className="form-error">{errors.category}</p>
            )}

            <Input
              label="HPP per porsi (Rp)"
              type="number"
              min="0"
              value={editing.hpp}
              onChange={(e: any) =>
                setEditing({
                  ...editing,
                  hpp: Number(e.target.value),
                })
              }
              error={errors.hpp}
            />

            <Input
              label="Berat per porsi (gram)"
              type="number"
              min="0"
              value={editing.weight}
              onChange={(e: any) =>
                setEditing({
                  ...editing,
                  weight: Number(e.target.value),
                })
              }
              error={errors.weight}
            />
          </div>
        </Modal>
      )}

      {deleting && (
        <Modal
          danger
          title="Hapus menu?"
          onClose={() => setDeleting(null)}
          footer={
            <>
              <Button
                variant="secondary"
                onClick={() => setDeleting(null)}
              >
                Batal
              </Button>
              <Button variant="danger" onClick={deleteMenu}>
                Ya, Hapus
              </Button>
            </>
          }
        >
          <p>
            Menu <strong>{deleting.name}</strong> akan dihapus dari daftar.
            Tindakan ini tidak dapat dibatalkan.
          </p>
        </Modal>
      )}
    </div>
  );
}

export function Production() {
  const {
    menus,
    records,
    setRecords,
    notify,
    profile,
    profileLoading,
  } = useApp();

  const today = () => {
    const date = new Date();
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, "0");
    const day = String(date.getDate()).padStart(2, "0");
    return `${year}-${month}-${day}`;
  };

  const initialForm = {
    date: today(),
    menuId: menus[0]?.id ?? "",
    production: "",
    sold: "",
    leftover: "",
  };

  const [form, setForm] = useState<any>(initialForm);
  const [error, setError] = useState("");
  const [editing, setEditing] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  // Mengambil catatan produksi dari Supabase
  useEffect(() => {
    if (profileLoading) return;

    if (!profile) {
      setRecords([]);
      setLoading(false);
      return;
    }

    let isMounted = true;

    const fetchRecords = async () => {
      setLoading(true);

      const { data, error } = await supabase
        .from("catatan_harian")
        .select(`
          id_catatan,
          id_menu,
          tanggal,
          jumlah_produksi,
          jumlah_terjual,
          jumlah_sisa,
          menu (
            nama_menu,
            hpp_per_porsi
          )
        `)
        .order("tanggal", { ascending: false });

      if (!isMounted) return;

      if (error) {
        console.error("Gagal mengambil catatan produksi:", error);
        notify("Gagal mengambil catatan: " + error.message);
        setRecords([]);
        setLoading(false);
        return;
      }

      const mappedRecords = (data || []).map((r: any) => ({
        id: r.id_catatan,
        menuId: r.id_menu,
        date: r.tanggal,
        menu: r.menu?.nama_menu || "Menu tidak ditemukan",
        production: Number(r.jumlah_produksi),
        sold: Number(r.jumlah_terjual),
        leftover: Number(r.jumlah_sisa),
        loss:
          Number(r.jumlah_sisa) *
          Number(r.menu?.hpp_per_porsi || 0),
      }));

      setRecords(mappedRecords);
      setLoading(false);
    };

    fetchRecords();

    return () => {
      isMounted = false;
    };
  }, [profileLoading, profile?.id_pengguna]);

  // Mengisi pilihan menu setelah data menu tersedia
  useEffect(() => {
    if (!form.menuId && menus.length > 0) {
      setForm((prev: any) => ({
        ...prev,
        menuId: menus[0].id,
      }));
    }
  }, [menus]);

  const validate = (f: any) => {
    const values = [
      f.production,
      f.sold,
      f.leftover,
    ].map(Number);

    if (values.some((v) => v < 0 || !Number.isFinite(v))) {
      return "Semua jumlah harus berupa angka non-negatif.";
    }

    if (
      f.production === "" ||
      f.sold === "" ||
      f.leftover === ""
    ) {
      return "Lengkapi seluruh jumlah produksi, terjual, dan sisa.";
    }

    if (
      Number(f.sold) + Number(f.leftover) >
      Number(f.production)
    ) {
      return "Jumlah terjual + sisa tidak boleh melebihi jumlah produksi.";
    }

    if (!f.menuId) {
      return "Pilih menu terlebih dahulu.";
    }

    if (!f.date) {
      return "Tanggal pencatatan wajib diisi.";
    }

    return "";
  };

  // Menyimpan catatan produksi
  const submit = async (e: any) => {
    e.preventDefault();

    if (!profile || saving) return;

    const message = validate(form);

    if (message) {
      setError(message);
      return;
    }

    const menu = menus.find(
      (m: any) => m.id === Number(form.menuId)
    );

    if (!menu) {
      setError("Menu tidak ditemukan.");
      return;
    }

    setSaving(true);
    setError("");

    const recordData = {
      id_menu: Number(form.menuId),
      tanggal: form.date,
      jumlah_produksi: Number(form.production),
      jumlah_terjual: Number(form.sold),
      jumlah_sisa: Number(form.leftover),
    };

    // Cek apakah menu sudah memiliki catatan pada tanggal tersebut
    const { data: existing, error: checkError } = await supabase
      .from("catatan_harian")
      .select("id_catatan")
      .eq("id_menu", Number(form.menuId))
      .eq("tanggal", form.date)
      .maybeSingle();

    if (checkError) {
      setSaving(false);
      setError("Gagal memeriksa catatan: " + checkError.message);
      return;
    }

    let savedData: any = null;
    let saveError: any = null;

    if (existing) {
      const result = await supabase
        .from("catatan_harian")
        .update(recordData)
        .eq("id_catatan", existing.id_catatan)
        .select()
        .single();

      savedData = result.data;
      saveError = result.error;
    } else {
      const result = await supabase
        .from("catatan_harian")
        .insert(recordData)
        .select()
        .single();

      savedData = result.data;
      saveError = result.error;
    }

    setSaving(false);

    if (saveError) {
      setError("Gagal menyimpan catatan: " + saveError.message);
      return;
    }

    const newRecord = {
      id: savedData.id_catatan,
      menuId: savedData.id_menu,
      date: savedData.tanggal,
      menu: menu.name,
      production: Number(savedData.jumlah_produksi),
      sold: Number(savedData.jumlah_terjual),
      leftover: Number(savedData.jumlah_sisa),
      loss:
        Number(savedData.jumlah_sisa) *
        Number(menu.hpp),
    };

    setRecords((prev: any[]) => [
      newRecord,
      ...prev.filter((r: any) => r.id !== newRecord.id),
    ]);

    setForm({
      ...initialForm,
      date: today(),
      menuId: menus[0]?.id ?? "",
    });

    notify(
      existing
        ? "Catatan produksi berhasil diperbarui."
        : "Catatan produksi berhasil disimpan."
    );
  };

  // Memperbarui catatan yang sudah ada
  const updateRecord = async () => {
    if (!editing || saving) return;

    const message = validate(editing);

    if (message) {
      setError(message);
      return;
    }

    const menu = menus.find(
      (m: any) => m.id === Number(editing.menuId)
    );

    if (!menu) {
      setError("Menu tidak ditemukan.");
      return;
    }

    setSaving(true);
    setError("");

    const { data, error } = await supabase
      .from("catatan_harian")
      .update({
        id_menu: Number(editing.menuId),
        tanggal: editing.date,
        jumlah_produksi: Number(editing.production),
        jumlah_terjual: Number(editing.sold),
        jumlah_sisa: Number(editing.leftover),
      })
      .eq("id_catatan", editing.id)
      .select()
      .single();

    setSaving(false);

    if (error) {
      setError("Gagal memperbarui catatan: " + error.message);
      return;
    }

    const updatedRecord = {
      id: data.id_catatan,
      menuId: data.id_menu,
      date: data.tanggal,
      menu: menu.name,
      production: Number(data.jumlah_produksi),
      sold: Number(data.jumlah_terjual),
      leftover: Number(data.jumlah_sisa),
      loss:
        Number(data.jumlah_sisa) *
        Number(menu.hpp),
    };

    setRecords((prev: any[]) =>
      prev.map((r: any) =>
        r.id === editing.id ? updatedRecord : r
      )
    );

    setEditing(null);
    setError("");
    notify("Catatan produksi berhasil diperbarui.");
  };

  const recent = records
    .slice()
    .sort((a: any, b: any) => b.date.localeCompare(a.date))
    .slice(0, 10);

  return (
    <div className="page">
      <PageHeader
        title="Catat Produksi"
        description="Catat jumlah produksi dan penjualan harian untuk mendapatkan rekomendasi yang lebih akurat."
      />

      <div className="two-column-layout">
        <Card>
          <SectionTitle
            title="Tambah catatan harian"
            subtitle="Pastikan data sesuai dengan catatan operasional hari ini."
          />

          <form onSubmit={submit} className="production-form">
            <Input
              label="Tanggal pencatatan"
              type="date"
              value={form.date}
              onChange={(e: any) =>
                setForm({ ...form, date: e.target.value })
              }
            />

            <Select
              label="Pilih menu"
              value={form.menuId}
              onChange={(e: any) =>
                setForm({
                  ...form,
                  menuId: Number(e.target.value),
                })
              }
            >
              <option value="">Pilih menu</option>
              {menus
                .filter((m: any) => m.status === "Aktif")
                .map((m: any) => (
                  <option value={m.id} key={m.id}>
                    {m.name}
                  </option>
                ))}
            </Select>

            <div className="quantity-grid">
              <Input
                label="Jumlah produksi"
                type="number"
                min="0"
                placeholder="0"
                value={form.production}
                onChange={(e: any) =>
                  setForm({
                    ...form,
                    production: e.target.value,
                  })
                }
              />

              <Input
                label="Jumlah terjual"
                type="number"
                min="0"
                placeholder="0"
                value={form.sold}
                onChange={(e: any) =>
                  setForm({
                    ...form,
                    sold: e.target.value,
                  })
                }
              />

              <Input
                label="Jumlah sisa"
                type="number"
                min="0"
                placeholder="0"
                value={form.leftover}
                onChange={(e: any) =>
                  setForm({
                    ...form,
                    leftover: e.target.value,
                  })
                }
              />
            </div>

            {error && (
              <div className="form-alert">
                <AlertCircle size={18} />
                <span>{error}</span>
              </div>
            )}

            <Button
              className="full-btn"
              icon={ClipboardCheck}
              type="submit"
              disabled={saving || menus.length === 0}
            >
              {saving ? "Menyimpan..." : "Simpan Catatan"}
            </Button>
          </form>
        </Card>

        <Card className="tip-card">
          <div className="tip-icon">
            <Lightbulb size={21} />
          </div>
          <h2>Tips pencatatan</h2>
          <p>
            Catat data di akhir jam operasional agar jumlah terjual dan sisa
            sudah final.
          </p>
          <ul>
            <li><Check size={15} /> Gunakan satuan porsi</li>
            <li><Check size={15} /> Catat setiap hari</li>
            <li><Check size={15} /> Periksa jumlah sebelum simpan</li>
          </ul>
        </Card>
      </div>

      <Card>
        <SectionTitle
          title="Riwayat produksi harian"
          subtitle="10 catatan produksi terbaru"
        />

        {loading ? (
          <p className="muted">Memuat catatan produksi...</p>
        ) : (
          <DataTable
            headers={[
              "Tanggal",
              "Menu",
              "Produksi",
              "Terjual",
              "Sisa",
              "Aksi",
            ]}
          >
            {recent.map((r: any) => (
              <tr key={r.id}>
                <td>{formatDate(r.date)}</td>
                <td><strong>{r.menu}</strong></td>
                <td>{r.production} porsi</td>
                <td>{r.sold} porsi</td>
                <td>
                  <Badge tone={r.leftover > 7 ? "warning" : "neutral"}>
                    {r.leftover} porsi
                  </Badge>
                </td>
                <td>
                  <button
                    className="text-action"
                    onClick={() => {
                      setEditing({ ...r });
                      setError("");
                    }}
                  >
                    <Edit3 size={15} /> Edit
                  </button>
                </td>
              </tr>
            ))}
          </DataTable>
        )}

        {!loading && recent.length === 0 && (
          <EmptyState
            icon={ClipboardCheck}
            title="Belum ada catatan produksi"
            text="Catatan produksi yang kamu tambahkan akan muncul di sini."
          />
        )}
      </Card>

      {editing && (
        <Modal
          title="Edit Catatan Produksi"
          onClose={() => {
            setEditing(null);
            setError("");
          }}
          footer={
            <>
              <Button
                variant="secondary"
                onClick={() => {
                  setEditing(null);
                  setError("");
                }}
              >
                Batal
              </Button>
              <Button onClick={updateRecord} disabled={saving}>
                {saving ? "Menyimpan..." : "Simpan Perubahan"}
              </Button>
            </>
          }
        >
          <div className="form-grid">
            <Input
              label="Tanggal"
              type="date"
              value={editing.date}
              onChange={(e: any) =>
                setEditing({ ...editing, date: e.target.value })
              }
            />

            <Select
              label="Pilih menu"
              value={editing.menuId}
              onChange={(e: any) =>
                setEditing({
                  ...editing,
                  menuId: Number(e.target.value),
                })
              }
            >
              {menus.map((m: any) => (
                <option value={m.id} key={m.id}>
                  {m.name}
                </option>
              ))}
            </Select>

            <Input
              label="Produksi"
              type="number"
              min="0"
              value={editing.production}
              onChange={(e: any) =>
                setEditing({
                  ...editing,
                  production: e.target.value,
                })
              }
            />

            <Input
              label="Terjual"
              type="number"
              min="0"
              value={editing.sold}
              onChange={(e: any) =>
                setEditing({
                  ...editing,
                  sold: e.target.value,
                })
              }
            />

            <Input
              label="Sisa"
              type="number"
              min="0"
              value={editing.leftover}
              onChange={(e: any) =>
                setEditing({
                  ...editing,
                  leftover: e.target.value,
                })
              }
            />
          </div>

          {error && (
            <div className="form-alert">
              <AlertCircle size={18} />
              {error}
            </div>
          )}
        </Modal>
      )}
    </div>
  );
}

export function Recommendations() {
  const { menus, records } = useApp();
  const [menuId, setMenuId] = useState(1);
  const [method, setMethod] = useState("Moving Average");

  const menu = menus.find((m: any) => m.id === Number(menuId));

  const history = records
    .filter((r: any) => r.menuId === Number(menuId))
    .sort((a: any, b: any) => a.date.localeCompare(b.date));

  const enough = history.length >= 7;
  const last7 = history.slice(-7);

  const average = enough
    ? Math.round(
        last7.reduce((s: number, r: any) => s + r.sold, 0) / 7
      )
    : 0;

  const recommendation =
    method === "Moving Average"
      ? Math.ceil(average * 1.04)
      : Math.ceil(average * 1.06);

  const graph = history.slice(-10).map((r: any) => ({
    date: shortDate(r.date),
    sold: r.sold,
    production: r.production,
  }));

  return (
    <div className="page">
      <PageHeader
        title="Rekomendasi Produksi"
        description="Gunakan pola penjualan historis sebagai referensi untuk merencanakan produksi berikutnya."
      />

      <Card className="filter-card">
        <div>
          <Select
            label="Menu"
            value={menuId}
            onChange={(e: any) => setMenuId(Number(e.target.value))}
          >
            {menus.map((m: any) => (
              <option value={m.id} key={m.id}>
                {m.name}
              </option>
            ))}
          </Select>

          <Select
            label="Metode peramalan"
            value={method}
            onChange={(e: any) => setMethod(e.target.value)}
          >
            <option>Moving Average</option>
            <option>Exponential Smoothing</option>
          </Select>
        </div>

        <div className="date-chip">
          <CalendarDays size={18} />
          <span>
            Tanggal rekomendasi<strong>26/11/2025</strong>
          </span>
        </div>
      </Card>

      {!menu ? (
        <Card>
          <EmptyState
            icon={UtensilsCrossed}
            title="Belum ada menu"
            text="Tambahkan menu terlebih dahulu untuk membuat rekomendasi produksi."
          />
        </Card>
      ) : !enough ? (
        <Card>
          <EmptyState
            icon={BarChart3}
            title="Data historis belum cukup"
            text={`${menu.name} baru memiliki ${history.length} hari data. Minimal 7 hari catatan diperlukan untuk menghasilkan rekomendasi.`}
            action={
              <Button
                variant="secondary"
                onClick={() => location.assign("/produksi")}
              >
                Tambah catatan produksi
              </Button>
            }
          />
        </Card>
      ) : (
        <>
          <div className="recommend-summary">
            <Card className="hero-recommend">
              <div>
                <Badge tone="warning">
                  <Sparkles size={13} /> REKOMENDASI BESOK
                </Badge>
                <p>Produksi yang disarankan</p>
                <h2>
                  {recommendation} <span>porsi</span>
                </h2>
                <strong>{menu.name}</strong>
              </div>
              <div className="confidence">
                <div className="confidence-ring">
                  7<small>hari</small>
                </div>
                <p>
                  Data historis
                  <br />
                  <strong>memadai</strong>
                </p>
              </div>
            </Card>

            <Card>
              <p className="eyebrow">Rata-rata penjualan</p>
              <h2 className="big-number">
                {average} <span>porsi/hari</span>
              </h2>
              <div className="positive">
                <ArrowUpRight size={16} /> Tren stabil selama 7 hari
              </div>
            </Card>

            <Card>
              <p className="eyebrow">Metode peramalan</p>
              <h2 className="method-title">{method}</h2>
              <p className="muted">
                Memberi bobot pada pola penjualan harian terbaru.
              </p>
            </Card>
          </div>

          <div className="dashboard-grid">
            <Card className="chart-card span-2">
              <SectionTitle
                title={`Tren historis ${menu.name}`}
                subtitle="10 hari catatan produksi dan penjualan terakhir"
              />
              <div className="chart-height">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={graph}>
                    <CartesianGrid
                      strokeDasharray="3 3"
                      vertical={false}
                      stroke="#E7E9E3"
                    />
                    <XAxis dataKey="date" tickLine={false} axisLine={false} />
                    <YAxis tickLine={false} axisLine={false} />
                    <Tooltip contentStyle={tooltipStyle} />
                    <Legend />
                    <Line
                      type="monotone"
                      dataKey="sold"
                      name="Terjual"
                      stroke="#174C3C"
                      strokeWidth={2.5}
                    />
                    <Line
                      type="monotone"
                      dataKey="production"
                      name="Produksi"
                      stroke="#D9A441"
                      strokeDasharray="5 5"
                    />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </Card>

            <Card className="explain-card">
              <Lightbulb size={22} />
              <h2>Mengapa jumlah ini?</h2>
              <p>
                Rekomendasi dihitung dari rata-rata penjualan 7 hari terakhir,
                kemudian disesuaikan dengan kecenderungan permintaan terbaru.
              </p>
              <div>
                <span>Rata-rata dasar</span>
                <strong>{average} porsi</strong>
              </div>
              <div>
                <span>Penyesuaian tren</span>
                <strong>+{recommendation - average} porsi</strong>
              </div>
              <div className="explain-total">
                <span>Rekomendasi</span>
                <strong>{recommendation} porsi</strong>
              </div>
            </Card>
          </div>

          <div className="advisory">
            <Info size={18} />
            <p>
              <strong>Rekomendasi bersifat saran.</strong> Sesuaikan dengan
              kondisi stok, cuaca, acara khusus, dan pertimbangan operasional
              usaha Anda.
            </p>
          </div>
        </>
      )}
    </div>
  );
}


export function Reports() {
  const { menus, profile, profileLoading, notify } = useApp();

  const today = new Date();
  const todayString = [
    today.getFullYear(),
    String(today.getMonth() + 1).padStart(2, "0"),
    String(today.getDate()).padStart(2, "0"),
  ].join("-");

  const firstDay = `${today.getFullYear()}-${String(
    today.getMonth() + 1
  ).padStart(2, "0")}-01`;

  const [menu, setMenu] = useState("Semua");
  const [start, setStart] = useState(firstDay);
  const [end, setEnd] = useState(todayString);
  const [reportRecords, setReportRecords] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // Mengambil data catatan produksi dari Supabase
  useEffect(() => {
    if (profileLoading) return;

    if (!profile) {
      setReportRecords([]);
      setLoading(false);
      return;
    }

    let isMounted = true;

    const fetchReports = async () => {
      setLoading(true);

      const { data, error } = await supabase
        .from("catatan_harian")
        .select(`
          id_catatan,
          tanggal,
          jumlah_produksi,
          jumlah_terjual,
          jumlah_sisa,
          menu!inner (
            id_menu,
            nama_menu,
            hpp_per_porsi,
            id_pengguna
          )
        `)
        .eq("menu.id_pengguna", profile.id_pengguna)
        .order("tanggal", { ascending: true });

      if (!isMounted) return;

      if (error) {
        console.error("Gagal mengambil laporan:", error);
        notify("Gagal mengambil laporan: " + error.message);
        setReportRecords([]);
        setLoading(false);
        return;
      }

      const mappedRecords = (data || []).map((r: any) => {
        const menuData = Array.isArray(r.menu)
          ? r.menu[0]
          : r.menu;

        const production = Number(r.jumlah_produksi || 0);
        const sold = Number(r.jumlah_terjual || 0);
        const leftover = Number(r.jumlah_sisa || 0);
        const hpp = Number(menuData?.hpp_per_porsi || 0);

        return {
          id: r.id_catatan,
          menuId: menuData?.id_menu,
          date: r.tanggal,
          menu: menuData?.nama_menu || "Menu tidak ditemukan",
          production,
          sold,
          leftover,
          loss: leftover * hpp,
        };
      });

      setReportRecords(mappedRecords);
      setLoading(false);
    };

    fetchReports();

    return () => {
      isMounted = false;
    };
  }, [profileLoading, profile?.id_pengguna]);

  // Filter laporan berdasarkan tanggal dan menu
  const filtered = reportRecords.filter(
    (r: any) =>
      r.date >= start &&
      r.date <= end &&
      (menu === "Semua" || r.menu === menu)
  );

  const total = (key: string) =>
    filtered.reduce(
      (sum: number, r: any) => sum + Number(r[key] || 0),
      0
    );

  // Rekap berdasarkan tanggal
  const byDate = [...new Set(filtered.map((r: any) => r.date))].map(
    (date) => {
      const rows = filtered.filter((r: any) => r.date === date);

      return {
        date: shortDate(String(date)),
        production: rows.reduce(
          (sum: number, r: any) => sum + r.production,
          0
        ),
        sold: rows.reduce(
          (sum: number, r: any) => sum + r.sold,
          0
        ),
        leftover: rows.reduce(
          (sum: number, r: any) => sum + r.leftover,
          0
        ),
      };
    }
  );

  // Rekap berdasarkan menu
  const byMenu = menus
    .map((m: any) => {
      const rows = filtered.filter(
        (r: any) => r.menuId === m.id
      );

      return {
        name: m.name.replace(" ", "\n"),
        sold: rows.reduce(
          (sum: number, r: any) => sum + r.sold,
          0
        ),
        leftover: rows.reduce(
          (sum: number, r: any) => sum + r.leftover,
          0
        ),
      };
    })
    .filter((x: any) => x.sold > 0 || x.leftover > 0);

  // Ekspor laporan ke CSV
  const exportCsv = () => {
    const rows = [
      [
        "Tanggal",
        "Menu",
        "Produksi",
        "Terjual",
        "Sisa",
        "Estimasi Kerugian",
      ],
      ...filtered.map((r: any) => [
        formatDate(r.date),
        r.menu,
        r.production,
        r.sold,
        r.leftover,
        r.loss,
      ]),
    ];

    const csvContent = rows
      .map((row) =>
        row
          .map((value) => `"${String(value).replace(/"/g, '""')}"`)
          .join(",")
      )
      .join("\n");

    const blob = new Blob(
      ["\uFEFF" + csvContent],
      { type: "text/csv;charset=utf-8;" }
    );

    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");

    a.href = url;
    a.download = "laporan-takaran.csv";
    a.click();

    URL.revokeObjectURL(url);
  };

  return (
    <div className="page">
      <PageHeader
        title="Laporan"
        description="Pantau performa produksi, penjualan, dan efisiensi bahan baku."
        actions={
          <Button
            variant="secondary"
            icon={Download}
            onClick={exportCsv}
            disabled={loading || filtered.length === 0}
          >
            Ekspor CSV
          </Button>
        }
      />

      <Card className="filter-card report-filter">
        <div>
          <Input
            label="Dari tanggal"
            type="date"
            value={start}
            onChange={(e: any) => setStart(e.target.value)}
          />

          <Input
            label="Sampai tanggal"
            type="date"
            value={end}
            onChange={(e: any) => setEnd(e.target.value)}
          />

          <Select
            label="Menu"
            value={menu}
            onChange={(e: any) => setMenu(e.target.value)}
          >
            <option>Semua</option>
            {menus.map((m: any) => (
              <option key={m.id} value={m.name}>
                {m.name}
              </option>
            ))}
          </Select>
        </div>

        <span className="filter-summary">
          {loading
            ? "Memuat laporan..."
            : `${filtered.length} catatan ditampilkan`}
        </span>
      </Card>

      <div className="metrics-grid">
        <MetricCard
          label="Total produksi"
          value={`${total("production")} porsi`}
          helper="Periode terpilih"
          icon={Factory}
        />

        <MetricCard
          label="Total terjual"
          value={`${total("sold")} porsi`}
          helper={`${Math.round(
            (total("sold") / Math.max(1, total("production"))) * 100
          )}% tingkat penjualan`}
          icon={ShoppingBag}
          tone="sage"
        />

        <MetricCard
          label="Total sisa"
          value={`${total("leftover")} porsi`}
          helper={`${Math.round(
            (total("leftover") / Math.max(1, total("production"))) * 100
          )}% dari produksi`}
          icon={PackageCheck}
          tone="mustard"
        />

        <MetricCard
          label="Estimasi kerugian"
          value={formatRp(total("loss"))}
          helper="Berdasarkan HPP menu"
          icon={CircleDollarSign}
          tone="red"
        />
      </div>

      <div className="dashboard-grid">
        <Card className="chart-card span-2">
          <SectionTitle
            title="Produksi vs penjualan"
            subtitle="Performa harian pada periode terpilih"
          />

          <div className="chart-height">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={byDate}>
                <CartesianGrid
                  strokeDasharray="3 3"
                  vertical={false}
                  stroke="#E7E9E3"
                />
                <XAxis
                  dataKey="date"
                  tickLine={false}
                  axisLine={false}
                />
                <YAxis tickLine={false} axisLine={false} />
                <Tooltip contentStyle={tooltipStyle} />
                <Legend />

                <Bar
                  dataKey="production"
                  name="Produksi"
                  fill="#B8CABB"
                  radius={[5, 5, 0, 0]}
                />

                <Bar
                  dataKey="sold"
                  name="Terjual"
                  fill="#174C3C"
                  radius={[5, 5, 0, 0]}
                />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </Card>

        <Card className="chart-card">
          <SectionTitle
            title="Tren sisa makanan"
            subtitle="Porsi tidak terjual"
          />

          <div className="chart-height">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={byDate}>
                <CartesianGrid
                  strokeDasharray="3 3"
                  vertical={false}
                  stroke="#E7E9E3"
                />
                <XAxis
                  dataKey="date"
                  tickLine={false}
                  axisLine={false}
                />
                <YAxis tickLine={false} axisLine={false} />
                <Tooltip contentStyle={tooltipStyle} />

                <Area
                  type="monotone"
                  dataKey="leftover"
                  name="Sisa"
                  stroke="#D9A441"
                  fill="#F5EBD6"
                  strokeWidth={2}
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </Card>
      </div>

      <Card className="chart-card">
        <SectionTitle
          title="Performa menu"
          subtitle="Perbandingan penjualan dan sisa per menu"
        />

        <div className="chart-height short">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart layout="vertical" data={byMenu}>
              <CartesianGrid
                strokeDasharray="3 3"
                horizontal={false}
                stroke="#E7E9E3"
              />
              <XAxis
                type="number"
                tickLine={false}
                axisLine={false}
              />
              <YAxis
                type="category"
                dataKey="name"
                width={100}
                tickLine={false}
                axisLine={false}
              />
              <Tooltip contentStyle={tooltipStyle} />
              <Legend />

              <Bar
                dataKey="sold"
                name="Terjual"
                fill="#174C3C"
                radius={[0, 5, 5, 0]}
              />

              <Bar
                dataKey="leftover"
                name="Sisa"
                fill="#D9A441"
                radius={[0, 5, 5, 0]}
              />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </Card>

      <Card>
        <SectionTitle
          title="Rincian laporan"
          subtitle="Data catatan produksi berdasarkan filter yang dipilih"
        />

        <DataTable
          headers={[
            "Tanggal",
            "Menu",
            "Produksi",
            "Terjual",
            "Sisa",
            "Estimasi kerugian",
          ]}
        >
          {loading ? (
            <tr>
              <td colSpan={6}>Memuat data laporan...</td>
            </tr>
          ) : filtered.length === 0 ? (
            <tr>
              <td colSpan={6}>
                Belum ada catatan produksi pada periode ini.
              </td>
            </tr>
          ) : (
            filtered.slice(0, 15).map((r: any) => (
              <tr key={r.id}>
                <td>{formatDate(r.date)}</td>
                <td>
                  <strong>{r.menu}</strong>
                </td>
                <td>{r.production}</td>
                <td>{r.sold}</td>
                <td>{r.leftover}</td>
                <td className="danger-text">
                  {formatRp(r.loss)}
                </td>
              </tr>
            ))
          )}
        </DataTable>
      </Card>
    </div>
  );
}




export function Impact() {
  const { profile, profileLoading, notify } = useApp();

  const getLocalDate = (date: Date) => {
    return [
      date.getFullYear(),
      String(date.getMonth() + 1).padStart(2, "0"),
      String(date.getDate()).padStart(2, "0"),
    ].join("-");
  };

  const today = new Date();
  const endDate = getLocalDate(today);

  const sevenDaysAgo = new Date(today);
  sevenDaysAgo.setDate(today.getDate() - 6);
  const startDate = getLocalDate(sevenDaysAgo);

  const [impactRecords, setImpactRecords] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // Mengambil catatan produksi, berat menu, dan faktor emisi
  useEffect(() => {
    if (profileLoading) return;

    if (!profile) {
      setImpactRecords([]);
      setLoading(false);
      return;
    }

    let isMounted = true;

    const fetchImpactData = async () => {
      setLoading(true);

      const { data, error } = await supabase
        .from("catatan_harian")
        .select(`
          id_catatan,
          tanggal,
          jumlah_sisa,
          menu!inner (
            id_menu,
            nama_menu,
            berat_per_porsi_kg,
            id_pengguna,
            kategori_makanan (
              nama_kategori,
              faktor_emisi,
              sumber_faktor,
              tahun_faktor
            )
          )
        `)
        .eq("menu.id_pengguna", profile.id_pengguna)
        .gte("tanggal", startDate)
        .lte("tanggal", endDate)
        .order("tanggal", { ascending: true });

      if (!isMounted) return;

      if (error) {
        console.error("Gagal mengambil data dampak:", error);
        notify("Gagal mengambil data dampak: " + error.message);
        setImpactRecords([]);
        setLoading(false);
        return;
      }

      const mappedRecords = (data || []).map((r: any) => {
        const menuData = Array.isArray(r.menu)
          ? r.menu[0]
          : r.menu;

        const categoryData = Array.isArray(
          menuData?.kategori_makanan
        )
          ? menuData.kategori_makanan[0]
          : menuData?.kategori_makanan;

        const leftover = Number(r.jumlah_sisa || 0);
        const weightPerPortion = Number(
          menuData?.berat_per_porsi_kg || 0
        );

        const factorValue = categoryData?.faktor_emisi;
        const parsedFactor =
          factorValue === null ||
          factorValue === undefined ||
          factorValue === ""
            ? null
            : Number(factorValue);

        const factor =
          parsedFactor !== null &&
          Number.isFinite(parsedFactor) &&
          parsedFactor >= 0
            ? parsedFactor
            : null;

        const weight = leftover * weightPerPortion;

        return {
          id: r.id_catatan,
          date: r.tanggal,
          menu: menuData?.nama_menu || "Menu tidak ditemukan",
          category:
            categoryData?.nama_kategori || "Kategori tidak ditemukan",
          leftover,
          weight,
          factor,
          emission: factor !== null ? weight * factor : null,
          source: categoryData?.sumber_faktor || null,
          factorYear: categoryData?.tahun_faktor || null,
        };
      });

      setImpactRecords(mappedRecords);
      setLoading(false);
    };

    fetchImpactData();

    return () => {
      isMounted = false;
    };
  }, [profileLoading, profile?.id_pengguna]);

  // Total berat sisa makanan
  const weight = impactRecords.reduce(
    (sum: number, d: any) => sum + d.weight,
    0
  );

  // Memastikan semua kategori sudah memiliki faktor emisi
  const missingCategories = [
    ...new Set(
      impactRecords
        .filter((d: any) => d.factor === null)
        .map((d: any) => d.category)
    ),
  ];

  const hasRecords = impactRecords.length > 0;
  const allFactorsConfigured =
    hasRecords && missingCategories.length === 0;

  // Emisi hanya ditampilkan jika seluruh faktor emisi tersedia
  const totalEmission = allFactorsConfigured
    ? impactRecords.reduce(
        (sum: number, d: any) => sum + (d.emission || 0),
        0
      )
    : null;

  // Mengelompokkan data berdasarkan tanggal
  const impactData = [
    ...new Set(impactRecords.map((d: any) => d.date)),
  ].map((date) => {
    const rows = impactRecords.filter(
      (d: any) => d.date === date
    );

    return {
      date: shortDate(String(date)),
      weight: Number(
        rows.reduce(
          (sum: number, d: any) => sum + d.weight,
          0
        ).toFixed(2)
      ),
    };
  });

  // Mengumpulkan sumber referensi faktor emisi
  const sources = [
    ...new Set(
      impactRecords
        .filter((d: any) => d.factor !== null && d.source)
        .map((d: any) => d.source)
    ),
  ];

  const factorYears = [
    ...new Set(
      impactRecords
        .filter((d: any) => d.factor !== null && d.factorYear)
        .map((d: any) => d.factorYear)
    ),
  ];

  const emissionValue = loading
    ? "Memuat..."
    : !hasRecords
      ? "Belum ada data"
      : !allFactorsConfigured
        ? "Belum lengkap"
        : `${totalEmission!.toFixed(2)} kg CO₂e`;

  const emissionHelper = loading
    ? "Mengambil data Supabase"
    : !hasRecords
      ? "Belum ada catatan produksi"
      : !allFactorsConfigured
        ? "Faktor emisi belum lengkap"
        : "Berdasarkan faktor emisi kategori";

  return (
    <div className="page">
      <PageHeader
        title="Dampak Lingkungan"
        description="Pahami potensi dampak sisa makanan dan dukung operasi yang lebih efisien."
      />

      <div className="impact-banner">
        <div className="impact-illustration">
          <Leaf size={32} />
        </div>

        <div>
          <Badge tone={hasRecords ? "success" : "warning"}>
            {loading
              ? "MEMUAT DATA"
              : hasRecords
                ? "DATA AKTUAL"
                : "BELUM ADA DATA"}
          </Badge>

          <h2>
            Setiap porsi yang terselamatkan adalah langkah baik
          </h2>

          <p>
            Mengurangi sisa makanan dapat membantu mencegah emisi
            yang terkait dengan produksi, distribusi, dan
            pembuangan makanan yang tidak dikonsumsi.
          </p>
        </div>
      </div>

      <div className="metrics-grid impact-metrics">
        <MetricCard
          label="Estimasi berat sisa"
          value={
            loading
              ? "Memuat..."
              : `${weight.toFixed(2)} kg`
          }
          helper="7 hari terakhir · berdasarkan berat menu"
          icon={Weight}
        />

        <MetricCard
          label="Potensi emisi terkait"
          value={emissionValue}
          helper={emissionHelper}
          icon={Leaf}
          tone="mustard"
        />

        <MetricCard
          label="Potensi CO₂e dihindari"
          value={emissionValue}
          helper={
            allFactorsConfigured
              ? "Potensi jika sisa makanan berhasil dicegah"
              : "Memerlukan faktor emisi lengkap"
          }
          icon={TrendingDown}
          tone="sage"
        />
      </div>

      <Card className="chart-card">
        <SectionTitle
          title="Tren estimasi sisa makanan"
          subtitle="Berat sisa berdasarkan berat per porsi menu"
        />

        <div className="chart-height">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={impactData}>
              <defs>
                <linearGradient
                  id="impact"
                  x1="0"
                  y1="0"
                  x2="0"
                  y2="1"
                >
                  <stop
                    offset="0"
                    stopColor="#38865A"
                    stopOpacity={0.25}
                  />
                  <stop
                    offset="1"
                    stopColor="#38865A"
                    stopOpacity={0}
                  />
                </linearGradient>
              </defs>

              <CartesianGrid
                strokeDasharray="3 3"
                vertical={false}
                stroke="#E7E9E3"
              />

              <XAxis
                dataKey="date"
                tickLine={false}
                axisLine={false}
              />

              <YAxis
                tickLine={false}
                axisLine={false}
                unit=" kg"
              />

              <Tooltip contentStyle={tooltipStyle} />

              <Area
                type="monotone"
                dataKey="weight"
                name="Estimasi sisa (kg)"
                stroke="#38865A"
                fill="url(#impact)"
                strokeWidth={2.5}
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </Card>

      <div className="method-grid">
        <Card>
          <div className="method-icon">
            <FileSpreadsheet size={21} />
          </div>

          <h2>Metodologi perhitungan</h2>

          <ol>
            <li>
              <span>1</span>
              <p>
                <strong>Jumlah sisa porsi</strong>
                <small>
                  Diambil dari catatan produksi harian di database.
                </small>
              </p>
            </li>

            <li>
              <span>2</span>
              <p>
                <strong>Estimasi berat</strong>
                <small>
                  Jumlah sisa × berat per porsi dari data menu.
                </small>
              </p>
            </li>

            <li>
              <span>3</span>
              <p>
                <strong>Potensi emisi</strong>
                <small>
                  Berat sisa × faktor emisi kategori makanan.
                </small>
              </p>
            </li>
          </ol>
        </Card>

        <Card className="reference-card">
          <AlertCircle size={22} />

          <div>
            <h2>Referensi faktor emisi</h2>

            <p>
              {loading
                ? "Memeriksa referensi faktor emisi..."
                : !hasRecords
                  ? "Belum ada data produksi untuk diperiksa."
                  : allFactorsConfigured
                    ? "Faktor emisi telah tersedia untuk seluruh kategori yang tercatat."
                    : "Beberapa kategori belum memiliki faktor emisi. Nilai CO₂e belum ditampilkan agar tidak memberikan klaim yang belum terverifikasi."}
            </p>

            <dl>
              <div>
                <dt>Status</dt>
                <dd>
                  <Badge
                    tone={
                      allFactorsConfigured
                        ? "success"
                        : "warning"
                    }
                  >
                    {loading
                      ? "Memeriksa"
                      : !hasRecords
                        ? "Belum ada data"
                        : allFactorsConfigured
                          ? "Terkonfigurasi"
                          : "Belum lengkap"}
                  </Badge>
                </dd>
              </div>

              <div>
                <dt>Sumber</dt>
                <dd>
                  {sources.length > 0
                    ? sources.join(", ")
                    : "Belum tersedia"}
                </dd>
              </div>

              <div>
                <dt>Tahun referensi</dt>
                <dd>
                  {factorYears.length > 0
                    ? factorYears.join(", ")
                    : "Belum tersedia"}
                </dd>
              </div>

              <div>
                <dt>Kategori belum lengkap</dt>
                <dd>
                  {missingCategories.length > 0
                    ? missingCategories.join(", ")
                    : "Tidak ada"}
                </dd>
              </div>

              <div>
                <dt>Sifat data</dt>
                <dd>
                  Estimasi potensial, bukan dampak terukur
                </dd>
              </div>
            </dl>
          </div>
        </Card>
      </div>

      <div className="advisory">
        <Info size={18} />
        <p>
          {loading
            ? "Data dampak lingkungan sedang dimuat."
            : "Angka berat merupakan estimasi berdasarkan berat per porsi yang tercatat pada menu. Hasil emisi bergantung pada kelengkapan dan validitas faktor emisi yang digunakan."}
        </p>
      </div>
    </div>
  );
}


export function SettingsPage() {
  const {
    profile,
    profileLoading,
    theme,
    setTheme,
    notify,
  } = useApp();

  const [namaUsaha, setNamaUsaha] = useState("");
  const [metode, setMetode] = useState("moving_average");
  const [jendelaK, setJendelaK] = useState("7");
  const [alfa, setAlfa] = useState("0.3");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!profile) return;

    setNamaUsaha(profile.nama_usaha || "");
    setMetode(profile.metode_peramalan || "moving_average");
    setJendelaK(String(profile.jendela_k || 7));
    setAlfa(String(profile.alfa ?? 0.3));
  }, [profile]);

  const saveSettings = async () => {
    if (!profile) {
      notify("Profil pengguna tidak ditemukan.");
      return;
    }

    if (!namaUsaha.trim()) {
      notify("Nama usaha tidak boleh kosong.");
      return;
    }

    const k = Number(jendelaK);
    const alpha = Number(alfa);

    if (
      metode === "moving_average" &&
      (!Number.isInteger(k) || k < 1)
    ) {
      notify("Jendela K harus berupa bilangan bulat minimal 1.");
      return;
    }

    if (
      metode === "single_exponential_smoothing" &&
      (!Number.isFinite(alpha) || alpha <= 0 || alpha >= 1)
    ) {
      notify("Nilai alfa harus lebih dari 0 dan kurang dari 1.");
      return;
    }

    setSaving(true);

    const { error } = await supabase
      .from("pengguna")
      .update({
        nama_usaha: namaUsaha.trim(),
        metode_peramalan: metode,
        jendela_k: k,
        alfa: alpha,
        tema: theme,
      })
      .eq("id_pengguna", profile.id_pengguna);

    setSaving(false);

    if (error) {
      console.error("Gagal menyimpan pengaturan:", error);
      notify("Gagal menyimpan pengaturan: " + error.message);
      return;
    }

    notify("Pengaturan berhasil disimpan.");
  };

  if (profileLoading) {
    return (
      <div className="page">
        <PageHeader
          title="Pengaturan"
          description="Kelola profil usaha dan preferensi aplikasi Takaran."
        />
        <Card>
          <p>Memuat pengaturan...</p>
        </Card>
      </div>
    );
  }

  return (
    <div className="page">
      <PageHeader
        title="Pengaturan"
        description="Kelola profil usaha dan preferensi aplikasi Takaran."
      />

      <div className="dashboard-grid">
        <Card className="span-2">
          <SectionTitle
            title="Profil usaha"
            subtitle="Informasi dasar usaha yang menggunakan Takaran."
          />

          <div className="form-grid">
            <Input
              label="Nama usaha"
              value={namaUsaha}
              onChange={(e: any) => setNamaUsaha(e.target.value)}
              placeholder="Masukkan nama usaha"
            />

            <Input
              label="Email akun"
              value={profile?.email || ""}
              disabled
            />
          </div>
        </Card>

        <Card>
          <SectionTitle
            title="Tampilan aplikasi"
            subtitle="Pilih tema yang nyaman digunakan."
          />

          <div className="form-grid">
            <Select
              label="Tema"
              value={theme}
              onChange={(e: any) => setTheme(e.target.value)}
            >
              <option value="light">Terang</option>
              <option value="dark">Gelap</option>
            </Select>
          </div>
        </Card>

        <Card>
          <SectionTitle
            title="Metode peramalan"
            subtitle="Atur metode yang digunakan untuk rekomendasi produksi."
          />

          <div className="form-grid">
            <Select
              label="Metode"
              value={metode}
              onChange={(e: any) => setMetode(e.target.value)}
            >
              <option value="moving_average">Moving Average</option>
              <option value="single_exponential_smoothing">
                Single Exponential Smoothing
              </option>
            </Select>

            {metode === "moving_average" ? (
              <Input
                label="Jendela K"
                type="number"
                value={jendelaK}
                onChange={(e: any) => setJendelaK(e.target.value)}
              />
            ) : (
              <Input
                label="Nilai Alfa (α)"
                type="number"
                value={alfa}
                onChange={(e: any) => setAlfa(e.target.value)}
              />
            )}
          </div>
        </Card>
      </div>

      <div className="page-actions">
        <Button
          icon={Check}
          onClick={saveSettings}
          disabled={saving || !profile}
        >
          {saving ? "Menyimpan..." : "Simpan Pengaturan"}
        </Button>
      </div>
    </div>
  );
}


export function AdminDashboard() {
  const { categories, emissions, menus } = useApp();

  return (
    <div className="page">
      <PageHeader
        title="Dashboard Admin"
        description="Kelola data referensi yang digunakan pada aplikasi Takaran."
      />

      <div className="metrics-grid">
        <MetricCard
          label="Total kategori"
          value={categories.length}
          helper="Seluruh kategori makanan"
          icon={Tags}
        />
        <MetricCard
          label="Menu terdaftar"
          value={menus.length}
          helper={`${menus.filter((m: any) => m.status === "Aktif").length} menu aktif`}
          icon={UtensilsCrossed}
          tone="sage"
        />
        <MetricCard
          label="Faktor emisi"
          value={emissions.length}
          helper="Menunggu sumber terverifikasi"
          icon={Leaf}
          tone="mustard"
        />
        <MetricCard
          label="Data perlu dilengkapi"
          value={emissions.filter((e: any) =>
            String(e.factor).includes("Belum")
          ).length}
          helper="Referensi faktor emisi"
          icon={AlertCircle}
          tone="red"
        />
      </div>

      <div className="dashboard-grid">
        <Card className="span-2">
          <SectionTitle
            title="Status data referensi"
            subtitle="Kelengkapan data administrasi"
          />
          <div className="admin-status">
            <div>
              <span className="status-icon good">
                <Check size={18} />
              </span>
              <p>
                <strong>Kategori makanan</strong>
                <small>{categories.length} kategori siap digunakan</small>
              </p>
              <Badge>Lengkap</Badge>
            </div>
            <div>
              <span className="status-icon warn">
                <AlertCircle size={18} />
              </span>
              <p>
                <strong>Faktor emisi</strong>
                <small>Sumber ilmiah perlu dikonfigurasi</small>
              </p>
              <Badge tone="warning">Perlu tindakan</Badge>
            </div>
          </div>
        </Card>

        <Card className="admin-note">
          <ShieldCheck size={24} />
          <h2>Ruang admin</h2>
          <p>
            Perubahan pada data referensi akan memengaruhi pilihan dan
            perhitungan di seluruh aplikasi.
          </p>
        </Card>
      </div>
    </div>
  );
}

function CrudAdmin({ type }: { type: "category" | "emission" }) {
  const app = useApp();
  const isCategory = type === "category";
  const items = isCategory ? app.categories : app.emissions;
  const setItems = isCategory ? app.setCategories : app.setEmissions;

  const [search, setSearch] = useState("");
  const [editing, setEditing] = useState<any>(null);
  const [deleting, setDeleting] = useState<any>(null);

  const filtered = items.filter((x: any) =>
    (x.name || x.category).toLowerCase().includes(search.toLowerCase())
  );

  const save = () => {
    if (editing.id) {
      setItems(
        items.map((x: any) =>
          x.id === editing.id ? editing : x
        )
      );
    } else {
      setItems([
        ...items,
        {
          ...editing,
          id: Date.now(),
          ...(isCategory
            ? {
                menuCount: 0,
                status: "Aktif",
                description: editing.description || "-",
              }
            : { updated: "25/11/2025" }),
        },
      ]);
    }

    setEditing(null);
    app.notify("Data referensi berhasil disimpan.");
  };

  const empty = isCategory
    ? { name: "", description: "" }
    : {
        category: app.categories[0]?.name || "",
        factor: "",
        unit: "kg CO₂e/kg",
        source: "",
      };

  return (
    <div className="page">
      <PageHeader
        title={isCategory ? "Kategori Makanan" : "Faktor Emisi"}
        description={
          isCategory
            ? "Kelola kelompok menu untuk menjaga data tetap rapi."
            : "Kelola faktor emisi dan sumber referensi untuk perhitungan estimasi."
        }
        actions={
          <Button icon={Plus} onClick={() => setEditing(empty)}>
            Tambah {isCategory ? "Kategori" : "Faktor"}
          </Button>
        }
      />

      <Card>
        <div className="toolbar">
          <label className="search-box">
            <Search size={18} />
            <input
              placeholder={`Cari ${
                isCategory ? "kategori" : "kategori makanan"
              }...`}
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </label>
          <span className="result-count">{filtered.length} data</span>
        </div>

        <DataTable
          headers={
            isCategory
              ? ["Nama kategori", "Deskripsi", "Jumlah menu", "Status", "Aksi"]
              : [
                  "Kategori",
                  "Faktor emisi",
                  "Satuan",
                  "Sumber referensi",
                  "Diperbarui",
                  "Aksi",
                ]
          }
        >
          {filtered.map((x: any) => (
            <tr key={x.id}>
              <td>
                <strong>{x.name || x.category}</strong>
              </td>

              {isCategory ? (
                <>
                  <td>{x.description}</td>
                  <td>{x.menuCount} menu</td>
                  <td>
                    <Badge>{x.status}</Badge>
                  </td>
                </>
              ) : (
                <>
                  <td>
                    <Badge
                      tone={
                        String(x.factor).includes("Belum")
                          ? "warning"
                          : "success"
                      }
                    >
                      {x.factor}
                    </Badge>
                  </td>
                  <td>{x.unit}</td>
                  <td>{x.source}</td>
                  <td>{x.updated}</td>
                </>
              )}

              <td>
                <div className="table-actions">
                  <button onClick={() => setEditing({ ...x })}>
                    <Edit3 size={17} />
                  </button>
                  <button
                    className="delete"
                    onClick={() => setDeleting(x)}
                  >
                    <Trash2 size={17} />
                  </button>
                </div>
              </td>
            </tr>
          ))}
        </DataTable>
      </Card>

      {editing && (
        <Modal
          title={`${editing.id ? "Edit" : "Tambah"} ${
            isCategory ? "Kategori" : "Faktor Emisi"
          }`}
          onClose={() => setEditing(null)}
          footer={
            <>
              <Button
                variant="secondary"
                onClick={() => setEditing(null)}
              >
                Batal
              </Button>
              <Button
                disabled={
                  isCategory
                    ? !editing.name
                    : !editing.category
                }
                onClick={save}
              >
                Simpan
              </Button>
            </>
          }
        >
          <div className="form-grid">
            {isCategory ? (
              <>
                <Input
                  label="Nama kategori"
                  value={editing.name}
                  onChange={(e: any) =>
                    setEditing({
                      ...editing,
                      name: e.target.value,
                    })
                  }
                />
                <Input
                  label="Deskripsi"
                  value={editing.description}
                  onChange={(e: any) =>
                    setEditing({
                      ...editing,
                      description: e.target.value,
                    })
                  }
                />
              </>
            ) : (
              <>
                <Select
                  label="Kategori makanan"
                  value={editing.category}
                  onChange={(e: any) =>
                    setEditing({
                      ...editing,
                      category: e.target.value,
                    })
                  }
                >
                  {app.categories.map((c: any) => (
                    <option key={c.id}>{c.name}</option>
                  ))}
                </Select>

                <Input
                  label="Nilai faktor emisi"
                  placeholder="Masukkan nilai setelah terverifikasi"
                  value={editing.factor}
                  onChange={(e: any) =>
                    setEditing({
                      ...editing,
                      factor: e.target.value,
                    })
                  }
                />

                <Input
                  label="Satuan"
                  value={editing.unit}
                  onChange={(e: any) =>
                    setEditing({
                      ...editing,
                      unit: e.target.value,
                    })
                  }
                />

                <Input
                  label="Sumber referensi"
                  value={editing.source}
                  onChange={(e: any) =>
                    setEditing({
                      ...editing,
                      source: e.target.value,
                    })
                  }
                />
              </>
            )}
          </div>

          {!isCategory && (
            <div className="form-alert neutral">
              <Info size={18} /> Pastikan nilai berasal dari sumber ilmiah
              yang dapat diverifikasi.
            </div>
          )}
        </Modal>
      )}

      {deleting && (
        <Modal
          danger
          title="Hapus data?"
          onClose={() => setDeleting(null)}
          footer={
            <>
              <Button
                variant="secondary"
                onClick={() => setDeleting(null)}
              >
                Batal
              </Button>
              <Button
                variant="danger"
                onClick={() => {
                  setItems(
                    items.filter((x: any) => x.id !== deleting.id)
                  );
                  setDeleting(null);
                  app.notify("Data berhasil dihapus.");
                }}
              >
                Ya, Hapus
              </Button>
            </>
          }
        >
          <p>
            Data <strong>{deleting.name || deleting.category}</strong> akan
            dihapus.
          </p>
        </Modal>
      )}
    </div>
  );
}

export function CategoriesAdmin() {
  return <CrudAdmin type="category" />;
}

export function EmissionsAdmin() {
  return <CrudAdmin type="emission" />;
}

export function NotFound() {
  return (
    <div className="page">
      <Card>
        <EmptyState
          icon={AlertCircle}
          title="Halaman tidak ditemukan"
          text="Alamat yang Anda buka tidak tersedia."
          action={
            <Button onClick={() => location.assign("/")}>
              Kembali ke Dashboard
            </Button>
          }
        />
      </Card>
    </div>
  );
}
