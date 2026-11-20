import { X, AlertTriangle, ChevronDown } from "lucide-react";

export function Button({
  children,
  variant = "primary",
  icon: Icon,
  className = "",
  ...props
}: any) {
  return (
    <button className={`btn btn-${variant} ${className}`} {...props}>
      {Icon && <Icon size={17} />}
      {children}
    </button>
  );
}

export function Input({ label, error, ...props }: any) {
  return (
    <label className="field">
      <span>{label}</span>
      <input {...props} />
      {error && <small className="field-error">{error}</small>}
    </label>
  );
}

export function Select({ label, children, ...props }: any) {
  return (
    <label className="field">
      <span>{label}</span>
      <div className="select-wrap">
        <select {...props}>{children}</select>
        <ChevronDown size={16} />
      </div>
    </label>
  );
}

export function Card({ children, className = "", ...props }: any) {
  return (
    <section className={`card ${className}`} {...props}>
      {children}
    </section>
  );
}

export function PageHeader({ title, description, actions }: any) {
  return (
    <div className="page-header">
      <div>
        <h1>{title}</h1>
        {description && <p>{description}</p>}
      </div>
      {actions && <div className="header-actions">{actions}</div>}
    </div>
  );
}

export function Badge({ children, tone = "success" }: any) {
  return <span className={`badge badge-${tone}`}>{children}</span>;
}

export function MetricCard({ label, value, helper, icon: Icon, tone = "green" }: any) {
  return (
    <Card className="metric-card">
      <div className={`metric-icon tone-${tone}`}>
        <Icon size={20} />
      </div>
      <div>
        <p>{label}</p>
        <strong>{value}</strong>
        <small>{helper}</small>
      </div>
    </Card>
  );
}

export function Modal({ title, children, onClose, footer, danger = false }: any) {
  return (
    <div className="modal-backdrop" onMouseDown={onClose}>
      <div
        className="modal"
        onMouseDown={(e) => e.stopPropagation()}
        role="dialog"
        aria-modal="true"
      >
        <div className="modal-head">
          {danger ? (
            <div className="danger-icon">
              <AlertTriangle size={20} />
            </div>
          ) : null}
          <h2>{title}</h2>
          <button className="icon-btn" onClick={onClose} aria-label="Tutup">
            <X size={20} />
          </button>
        </div>
        <div className="modal-body">{children}</div>
        {footer && <div className="modal-footer">{footer}</div>}
      </div>
    </div>
  );
}

export function EmptyState({ icon: Icon, title, text, action }: any) {
  return (
    <div className="empty">
      <div className="empty-icon">
        <Icon size={24} />
      </div>
      <h3>{title}</h3>
      <p>{text}</p>
      {action}
    </div>
  );
}

export function DataTable({ headers, children }: any) {
  return (
    <div className="table-scroll">
      <div className="table-scroll-hint" aria-hidden="true">
        <span>Geser tabel untuk melihat kolom lainnya</span>
        <ChevronDown size={14} />
      </div>
      <div
        className="table-wrap"
        tabIndex={0}
        role="region"
        aria-label="Tabel data dapat digeser horizontal"
      >
        <table>
          <thead>
            <tr>
              {headers.map((h: string) => (
                <th key={h}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>{children}</tbody>
        </table>
      </div>
    </div>
  );
}

export function SectionTitle({ title, subtitle, action }: any) {
  return (
    <div className="section-title">
      <div>
        <h2>{title}</h2>
        {subtitle && <p>{subtitle}</p>}
      </div>
      {action}
    </div>
  );
}
