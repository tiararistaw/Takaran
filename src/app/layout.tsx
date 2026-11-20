
import { useState } from "react";
import { NavLink, Outlet, useLocation, useNavigate } from "react-router";
import {
  Bell,
  ChevronRight,
  ClipboardPlus,
  Gauge,
  Leaf,
  Lightbulb,
  LogOut,
  Menu,
  Settings,
  ShieldCheck,
  Tags,
  UtensilsCrossed,
  X,
  BarChart3,
  Factory,
  Database,
  CheckCircle2,
} from "lucide-react";

import { AppProvider, useApp } from "./state";

const ownerNav = [
  ["Dashboard", "/dashboard", Gauge],
  ["Kelola Menu", "/menu", UtensilsCrossed],
  ["Catat Produksi", "/produksi", ClipboardPlus],
  ["Rekomendasi Produksi", "/rekomendasi", Lightbulb],
  ["Laporan", "/laporan", BarChart3],
  ["Dampak Lingkungan", "/dampak", Leaf],
  ["Pengaturan", "/pengaturan", Settings],
] as const;

const adminNav = [
  ["Dashboard Admin", "/admin", ShieldCheck],
  ["Kategori Makanan", "/admin/kategori", Tags],
  ["Faktor Emisi", "/admin/emisi", Database],
] as const;

const pageTitles: Record<string, string> = {
  "/dashboard": "Dashboard",
  "/menu": "Kelola Menu",
  "/produksi": "Catat Produksi",
  "/rekomendasi": "Rekomendasi Produksi",
  "/laporan": "Laporan",
  "/dampak": "Dampak Lingkungan",
  "/pengaturan": "Pengaturan",
  "/admin": "Dashboard Admin",
  "/admin/kategori": "Kategori Makanan",
  "/admin/emisi": "Faktor Emisi",
};

function Logo() {
  return (
    <div className="brand">
      <div className="brand-mark">
        <span />
        <span />
        <span />
      </div>
      <div>
        <strong>Takaran</strong>
        <small>Produksi lebih cerdas</small>
      </div>
    </div>
  );
}

function getInitials(name: string) {
  return (
    name
      .split(" ")
      .filter(Boolean)
      .slice(0, 2)
      .map((word) => word[0])
      .join("")
      .toUpperCase() || "T"
  );
}

type SidebarProps = {
  admin: boolean;
  open: boolean;
  onClose: () => void;
};

function Sidebar({ admin, open, onClose }: SidebarProps) {
  const nav: readonly (
    readonly [string, string, typeof Gauge]
  )[] = admin ? adminNav : ownerNav;
  const navigate = useNavigate();

  const { profile, logout } = useApp();

  const namaUsaha = profile?.nama_usaha || "Nama Usaha";
  const email = profile?.email || "Email belum tersedia";
  const inisial = getInitials(namaUsaha);

  const handleLogout = async () => {
    const success = await logout();

    if (success) {
      navigate("/login", { replace: true });
    }
  };

  return (
    <aside className={`sidebar ${open ? "sidebar-open" : ""}`}>
      <div className="sidebar-top">
        <Logo />

        <button
          className="sidebar-close icon-btn"
          onClick={onClose}
          aria-label="Tutup menu"
        >
          <X size={20} />
        </button>
      </div>

      <div className="workspace-chip">
        <span>{admin ? "AD" : inisial}</span>

        <div>
          <strong>
            {admin ? "Panel Administrator" : namaUsaha}
          </strong>

          <small>
            {admin ? "Kelola data sistem" : email}
          </small>
        </div>
      </div>

      <nav className="side-nav">
        <p>{admin ? "ADMINISTRASI" : "MENU UTAMA"}</p>

        {nav.map(([label, to, Icon]) => (
          <NavLink
            key={to}
            to={to}
            end={to === "/" || to === "/admin"}
            onClick={onClose}
          >
            <Icon size={19} />
            <span>{label}</span>
          </NavLink>
        ))}
      </nav>

      <div className="sidebar-bottom">
        {!admin && (
          <button
            className="admin-link"
            onClick={() => navigate("/admin")}
          >
            <ShieldCheck size={18} />
            <span>Masuk Panel Admin</span>
            <ChevronRight size={16} />
          </button>
        )}

        {admin && (
          <button
            className="admin-link"
            onClick={() => navigate("/dashboard")}
          >
            <Gauge size={18} />
            <span>Kembali ke Bisnis</span>
            <ChevronRight size={16} />
          </button>
        )}

        <div className="profile-row">
          <div className="avatar">{inisial}</div>

          <div>
            <strong>{namaUsaha}</strong>
            <small>
              {admin ? "Administrator" : "Pemilik Usaha"}
            </small>
          </div>

          <button
            className="icon-btn"
            aria-label="Keluar"
            onClick={handleLogout}
          >
            <LogOut size={18} />
          </button>
        </div>
      </div>
    </aside>
  );
}

function Shell({ admin = false }: { admin?: boolean }) {
  const [navOpen, setNavOpen] = useState(false);
  const [notifications, setNotifications] = useState(false);

  const location = useLocation();
  const { profile } = useApp();

  const title = pageTitles[location.pathname] || "Takaran";
  const namaUsaha = profile?.nama_usaha || "Takaran";
  const inisial = getInitials(namaUsaha);

  const today = new Intl.DateTimeFormat("id-ID", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
  }).format(new Date("2025-11-25"));

  return (
    <div className="app-shell">
      <Sidebar
        admin={admin}
        open={navOpen}
        onClose={() => setNavOpen(false)}
      />

      {navOpen && (
        <div
          className="sidebar-overlay"
          onClick={() => setNavOpen(false)}
        />
      )}

      <div className="main-column">
        <header className="topbar">
          <div className="topbar-left">
            <button
              className="mobile-menu icon-btn"
              onClick={() => setNavOpen(true)}
              aria-label="Buka menu"
            >
              <Menu size={21} />
            </button>

            <div>
              <span className="crumb">
                {admin ? "Admin" : namaUsaha} /
              </span>

              <strong>{title}</strong>
            </div>
          </div>

          <div className="topbar-right">
            <span className="current-date">{today}</span>

            <div className="notification-wrap">
              <button
                className="icon-btn notification-btn"
                onClick={() => setNotifications(!notifications)}
                aria-label="Notifikasi"
              >
                <Bell size={20} />
                <i />
              </button>

              {notifications && (
                <div className="notification-popover">
                  <h3>Notifikasi</h3>

                  <div>
                    <span className="notification-dot">
                      <CheckCircle2 size={16} />
                    </span>

                    <p>
                      <strong>Rekomendasi siap</strong>
                      <small>
                        Rekomendasi produksi besok telah diperbarui.
                      </small>
                    </p>
                  </div>

                  <div>
                    <span className="notification-dot mustard">
                      <Factory size={16} />
                    </span>

                    <p>
                      <strong>Catatan produksi</strong>
                      <small>
                        Lengkapi data penjualan Es Teh Manis hari ini.
                      </small>
                    </p>
                  </div>

                  <button
                    onClick={() => setNotifications(false)}
                  >
                    Tandai semua telah dibaca
                  </button>
                </div>
              )}
            </div>

            <div className="top-avatar">{inisial}</div>
          </div>
        </header>

        <main>
          <Outlet />
        </main>
      </div>
    </div>
  );
}

export function OwnerLayout() {
  return <Shell />;
}

export function AdminLayout() {
  return <Shell admin />;
}

export default function Root() {
  return (
    <AppProvider>
      <Outlet />
    </AppProvider>
  );
}
