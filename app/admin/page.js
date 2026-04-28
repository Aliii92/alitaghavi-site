export default function AdminLandingPage() {
  return (
    <main className="luxury-page admin-page">
      <section className="admin-login-panel">
        <p className="section-eyebrow">Private Dashboard</p>
        <h1>Choose Admin Panel</h1>
        <p>Select the advisor dashboard you want to manage.</p>
        <div className="admin-actions" style={{ justifyContent: "center", marginTop: 24 }}>
          <a className="button primary-button" href="/admin/ali">
            Ali Admin
          </a>
          <a className="button secondary-button" href="/admin/negin">
            Negin Admin
          </a>
          <a className="button secondary-button" href="/admin/blog">
            Blog
          </a>
        </div>
      </section>
    </main>
  );
}
