export default function Home() {
  return (
    <section className="dashboard-home" aria-labelledby="dashboard-title">
      <div className="dashboard-intro">
        <p className="dashboard-kicker">BN-DASH · REACT WORKSPACE</p>
        <h1 id="dashboard-title">Dashboard</h1>
        <p className="dashboard-lead">
          Interactive dashboards and analytical tools will be added here.
        </p>
      </div>

      <div className="dashboard-empty" aria-label="Dashboard workspace ready">
        <div className="dashboard-empty-top">
          <span>WORKSPACE</span>
          <span>01 / READY</span>
        </div>
        <div className="dashboard-empty-content">
          <span className="dashboard-cross" aria-hidden="true">＋</span>
          <h2>Your dashboard workspace is ready.</h2>
          <p>
            Keep this page in <code>src/dashboard/Home.tsx</code>. Add future React dashboard
            files in the same <code>src/dashboard/</code> folder and import them here when needed.
          </p>
        </div>
      </div>

      {/* raw CSS: plain <style> text is escaped differently on the server and in the browser, which breaks hydration */}
      <style dangerouslySetInnerHTML={{ __html: `
        .dashboard-home { max-width: 1440px; margin: 0 auto; padding: clamp(44px, 7vw, 92px) clamp(18px, 4vw, 56px) 30px; color: var(--ink, #16181c); }
        .dashboard-intro { max-width: 780px; }
        .dashboard-kicker { margin: 0 0 18px; font: 500 11px/1.4 'Geist Mono', monospace; letter-spacing: .12em; color: var(--ink-soft, #526052); }
        .dashboard-intro h1 { margin: 0; font: 800 clamp(64px, 11vw, 150px)/.84 'Big Shoulders Display', sans-serif; letter-spacing: -.025em; text-transform: uppercase; }
        .dashboard-lead { max-width: 54ch; margin: 25px 0 0; font: 400 clamp(16px, 1.8vw, 21px)/1.55 'Geist', sans-serif; color: var(--ink-soft, #4c535c); }
        .dashboard-empty { margin-top: clamp(48px, 8vw, 100px); border: 1px solid var(--dashboard-border, rgba(22,24,28,.48)); min-height: 300px; background-color: var(--dashboard-panel, transparent); background-image: linear-gradient(var(--dashboard-grid, rgba(22,24,28,.035)) 1px, transparent 1px), linear-gradient(90deg, var(--dashboard-grid, rgba(22,24,28,.035)) 1px, transparent 1px); background-size: 40px 40px; }
        .dashboard-empty-top { display: flex; justify-content: space-between; gap: 16px; padding: 13px 16px; border-bottom: 1px solid var(--dashboard-border, rgba(22,24,28,.35)); font: 500 10px/1.4 'Geist Mono', monospace; letter-spacing: .09em; }
        .dashboard-empty-content { max-width: 620px; padding: clamp(28px, 5vw, 58px); }
        .dashboard-cross { display: inline-grid; place-items: center; width: 38px; height: 38px; border: 1px solid var(--dashboard-border, rgba(22,24,28,.45)); border-radius: 50%; font: 400 23px/1 'Geist', sans-serif; }
        .dashboard-empty h2 { margin: 24px 0 12px; font: 700 clamp(28px, 4vw, 46px)/1 'Big Shoulders Display', sans-serif; text-transform: uppercase; }
        .dashboard-empty p { margin: 0; color: var(--ink-soft, #4c535c); font: 400 15px/1.7 'Geist', sans-serif; }
        .dashboard-empty code { padding: 2px 5px; background: var(--dashboard-code-bg, rgba(22,24,28,.07)); font: 400 .9em 'Geist Mono', monospace; }
        @media (max-width: 640px) { .dashboard-empty { min-height: 260px; } .dashboard-empty-top { font-size: 9px; } }
      ` }} />
    </section>
  );
}
