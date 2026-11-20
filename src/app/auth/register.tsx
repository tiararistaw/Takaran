
import { useState, type FormEvent } from "react";
import { Link } from "react-router";
import { supabase } from "../../lib/supabase";

export default function Register() {
  const [namaUsaha, setNamaUsaha] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [konfirmasiPassword, setKonfirmasiPassword] = useState("");

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);

  const handleRegister = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError("");

    if (password.length < 6) {
      setError("Password minimal terdiri dari 6 karakter.");
      return;
    }

    if (password !== konfirmasiPassword) {
      setError("Konfirmasi password tidak sesuai.");
      return;
    }

    setLoading(true);

    try {
      const { error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            nama_usaha: namaUsaha,
          },
        },
      });

      if (error) {
        throw error;
      }

      setSuccess(true);
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Registrasi gagal. Silakan coba kembali.",
      );
    } finally {
      setLoading(false);
    }
  };

  if (success) {
    return (
      <main className="auth-page">
        <section className="auth-card">
          <div className="auth-logo">
            <span className="auth-logo-mark">T</span>
            <span>takaran</span>
          </div>

          <div className="auth-success">
            <div className="auth-success-icon">✓</div>
            <h1>Registrasi Berhasil!</h1>
            <p>
              Akun Takaran kamu berhasil dibuat. Silakan cek email{" "}
              <strong>{email}</strong> untuk melakukan konfirmasi akun.
            </p>
            <Link to="/login" className="auth-button">
              Kembali ke Login
            </Link>
          </div>
        </section>
      </main>
    );
  }

  return (
    <main className="auth-page">
      <section className="auth-card">
        <div className="auth-logo">
          <span className="auth-logo-mark">T</span>
          <span>takaran</span>
        </div>

        <div className="auth-heading">
          <p className="auth-eyebrow">MULAI BERSAMA TAKARAN</p>
          <h1>Buat Akun Baru</h1>
          <p>
            Daftarkan usahamu dan mulai kelola produksi dengan lebih mudah.
          </p>
        </div>

        <form onSubmit={handleRegister} className="auth-form">
          <div className="auth-field">
            <label htmlFor="namaUsaha">Nama Usaha</label>
            <input
              id="namaUsaha"
              type="text"
              placeholder="Contoh: Warung Rasa"
              value={namaUsaha}
              onChange={(e) => setNamaUsaha(e.target.value)}
              required
            />
          </div>

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
              placeholder="Minimal 6 karakter"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              minLength={6}
              required
            />
          </div>

          <div className="auth-field">
            <label htmlFor="konfirmasiPassword">Konfirmasi Password</label>
            <input
              id="konfirmasiPassword"
              type="password"
              placeholder="Masukkan ulang password"
              value={konfirmasiPassword}
              onChange={(e) => setKonfirmasiPassword(e.target.value)}
              required
            />
          </div>

          {error && <p className="auth-error">{error}</p>}

          <button
            type="submit"
            className="auth-button"
            disabled={loading}
          >
            {loading ? "Memproses..." : "Daftar Sekarang"}
          </button>
        </form>

        <p className="auth-footer">
          Sudah punya akun? <Link to="/login">Masuk di sini</Link>
        </p>

        <p className="auth-note">
          Dengan mendaftar, kamu dapat mulai mengelola data usaha melalui
          Takaran.
        </p>
      </section>
    </main>
  );
}
