
import { useState, type FormEvent } from "react";
import { Link, useNavigate } from "react-router";
import { supabase } from "../../lib/supabase";

export default function Login() {
  const navigate = useNavigate();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleLogin = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) throw error;

      const { data: profile, error: profileError } = await supabase
        .from("pengguna")
        .select("id_pengguna, nama_usaha, email, peran, tema")
        .eq("auth_user_id", data.user.id)
        .single();

      if (profileError) {
  console.error("Detail error profil:", profileError);
  console.error("User ID:", data.user.id);

  await supabase.auth.signOut();

  throw new Error(
    `Gagal mengambil profil: ${profileError.message}`,
  );
}

      if (profile.peran === "admin") {
         navigate("/admin");
        } else {
        navigate("/dashboard");
      }
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Email atau password tidak valid.",
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="auth-page">
      <section className="auth-card">
        <div className="auth-logo">
          <span className="auth-logo-mark">T</span>
          <span>takaran</span>
        </div>

        <div className="auth-heading">
          <p className="auth-eyebrow">SELAMAT DATANG KEMBALI</p>
          <h1>Masuk ke Takaran</h1>
          <p>
            Masuk untuk melanjutkan pengelolaan produksi dan usaha kamu.
          </p>
        </div>

        <form onSubmit={handleLogin} className="auth-form">
          <div className="auth-field">
            <label htmlFor="email">Email</label>
            <input
              id="email"
              type="email"
              placeholder="nama@email.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </div>

          <div className="auth-field">
            <label htmlFor="password">Password</label>
            <input
              id="password"
              type="password"
              placeholder="Masukkan password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
          </div>

          {error && <p className="auth-error">{error}</p>}

          <button
            type="submit"
            className="auth-button"
            disabled={loading}
          >
            {loading ? "Memproses..." : "Masuk"}
          </button>
        </form>

        <p className="auth-footer">
          Belum punya akun? <Link to="/register">Daftar sekarang</Link>
        </p>

        <p className="auth-note">
          Takaran membantu UMKM mengelola produksi dengan lebih terukur.
        </p>
      </section>
    </main>
  );
}
