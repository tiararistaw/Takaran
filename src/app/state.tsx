
import {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";

import type { ReactNode } from "react";
import type { Session, User } from "@supabase/supabase-js";

import { supabase } from "../lib/supabase";

import {
  categorySeed,
  emissionSeed,
  menuSeed,
  recordSeed,
} from "./data";

type UserProfile = {
  id_pengguna: number;
  auth_user_id: string;
  nama_usaha: string;
  email: string;
  peran: string;
  tema: string;
  metode_peramalan: string;
  jendela_k: number;
  alfa?: number;
  tanggal_mulai_takaran?: string;
};

type AppContextType = {
  menus: any[];
  setMenus: React.Dispatch<React.SetStateAction<any[]>>;

  records: any[];
  setRecords: React.Dispatch<React.SetStateAction<any[]>>;

  categories: any[];
  setCategories: React.Dispatch<React.SetStateAction<any[]>>;

  emissions: any[];
  setEmissions: React.Dispatch<React.SetStateAction<any[]>>;

  theme: string;
  setTheme: React.Dispatch<React.SetStateAction<string>>;

  toast: string;
  notify: (message: string) => void;

  session: Session | null;
  user: User | null;
  profile: UserProfile | null;

  authLoading: boolean;
  profileLoading: boolean;
  isAuthenticated: boolean;

  logout: () => Promise<boolean>;
};

const AppContext = createContext<AppContextType | null>(null);

export function AppProvider({ children }: { children: ReactNode }) {
  const [menus, setMenus] = useState<any[]>(menuSeed);
  const [records, setRecords] = useState<any[]>(recordSeed);
  const [categories, setCategories] = useState<any[]>(categorySeed);
  const [emissions, setEmissions] = useState<any[]>(emissionSeed);

  const [theme, setTheme] = useState("light");
  const [toast, setToast] = useState("");

  const [session, setSession] = useState<Session | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);

  const [authLoading, setAuthLoading] = useState(true);
  const [profileLoading, setProfileLoading] = useState(false);

  // Memeriksa sesi login pengguna
  useEffect(() => {
    let mounted = true;

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, newSession) => {
      if (mounted) {
        setSession(newSession);
        setAuthLoading(false);
      }
    });

    supabase.auth
      .getSession()
      .then(({ data, error }) => {
        if (!mounted) return;

        if (error) {
          console.error("Gagal mengambil sesi:", error.message);
        }

        setSession(data.session);
        setAuthLoading(false);
      });

    return () => {
      mounted = false;
      subscription.unsubscribe();
    };
  }, []);

  // Mengambil profil usaha dari Supabase
  useEffect(() => {
    let mounted = true;

    const fetchProfile = async () => {
      if (!session?.user) {
        setProfile(null);
        setProfileLoading(false);
        return;
      }

      setProfileLoading(true);

      const { data, error } = await supabase
        .from("pengguna")
        .select("*")
        .eq("auth_user_id", session.user.id)
        .single();

      if (!mounted) return;

      if (error) {
        console.error("Gagal mengambil profil:", error.message);
        setProfile(null);
      } else {
        setProfile(data as UserProfile);
      }

      setProfileLoading(false);
    };

    fetchProfile();

    return () => {
      mounted = false;
    };
  }, [session?.user?.id]);

  // Memperbarui data pengguna
  useEffect(() => {
    setUser(session?.user ?? null);
  }, [session]);

  // Mengikuti tema dari profil pengguna
  useEffect(() => {
    if (profile?.tema) {
      setTheme(profile.tema);
    }
  }, [profile]);

  // Mengatur tema aplikasi
  useEffect(() => {
    document.documentElement.dataset.theme = theme;
  }, [theme]);

  // Menampilkan notifikasi
  const notify = (message: string) => {
    setToast(message);

    window.setTimeout(() => {
      setToast("");
    }, 2600);
  };

  // Logout dari Supabase
  const logout = async (): Promise<boolean> => {
    const { error } = await supabase.auth.signOut();

    if (error) {
      console.error("Gagal logout:", error.message);
      notify("Gagal keluar dari akun.");
      return false;
    }

    setProfile(null);
    setUser(null);
    setSession(null);
    setTheme("light");

    notify("Berhasil keluar dari akun.");

    return true;
  };

  const value = useMemo(
    () => ({
      menus,
      setMenus,
      records,
      setRecords,
      categories,
      setCategories,
      emissions,
      setEmissions,
      theme,
      setTheme,
      toast,
      notify,
      session,
      user,
      profile,
      authLoading,
      profileLoading,
      isAuthenticated: !!session,
      logout,
    }),
    [
      menus,
      records,
      categories,
      emissions,
      theme,
      toast,
      session,
      user,
      profile,
      authLoading,
      profileLoading,
    ],
  );

  return (
    <AppContext.Provider value={value}>
      {children}

      {toast && (
        <div className="toast" role="status">
          {toast}
        </div>
      )}
    </AppContext.Provider>
  );
}

export function useApp() {
  const context = useContext(AppContext);

  if (!context) {
    throw new Error("useApp harus digunakan di dalam AppProvider.");
  }

  return context;
}
