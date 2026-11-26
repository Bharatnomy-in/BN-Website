import { useState } from "react";
import {
  ArrowLeft,
  ArrowRight,
  ArrowUpRight,
  BarChart3,
  Clock3,
  Compass,
  Layers3,
  MapPinned,
  Plus,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";
import MaharashtraClimate from "./Maharastra-Climate";

type DashboardItem = {
  id: string;
  number: string;
  title: string;
  eyebrow: string;
  description: string;
  category: string;
  status: "available" | "coming-soon";
  icon: LucideIcon;
  meta: string;
};

// Add future dashboards here. Connect an available dashboard in DashboardView below.
const dashboards: DashboardItem[] = [
  {
    id: "maharashtra-climate",
    number: "01",
    title: "Maharashtra Climate",
    eyebrow: "CLIMATE INTELLIGENCE",
    description:
      "Explore district-level temperature, heatwave and warm-night patterns across Maharashtra, with historical trends from 1951 onwards.",
    category: "Climate",
    status: "available",
    icon: MapPinned,
    meta: "35 districts · 1951–2024",
  },
  {
    id: "economy",
    number: "02",
    title: "Economy & Markets",
    eyebrow: "ECONOMIC INDICATORS",
    description:
      "A future workspace for exploring India's economic indicators, public datasets and market signals.",
    category: "Economy",
    status: "coming-soon",
    icon: BarChart3,
    meta: "In development",
  },
  {
    id: "energy",
    number: "03",
    title: "Energy & Transition",
    eyebrow: "ENERGY INTELLIGENCE",
    description:
      "A future workspace for tracking energy systems, capacity, demand and transition indicators.",
    category: "Energy",
    status: "coming-soon",
    icon: Compass,
    meta: "In development",
  },
];

function DashboardView({
  id,
  onBack,
}: {
  id: string;
  onBack: () => void;
}) {
  if (id === "maharashtra-climate") {
    return (
      <div className="bn-dashboard-view">
        <button className="bn-dashboard-back" type="button" onClick={onBack}>
          <ArrowLeft size={14} strokeWidth={1.8} />
          <span>Back to dashboards</span>
        </button>
        <MaharashtraClimate />
      </div>
    );
  }

  return null;
}

export default function Home() {
  const [activeDashboard, setActiveDashboard] = useState<string | null>(null);
  const availableCount = dashboards.filter((item) => item.status === "available").length;
  const featured = dashboards[0];
  const upcoming = dashboards.slice(1);

  if (activeDashboard) {
    return (
      <DashboardView
        id={activeDashboard}
        onBack={() => setActiveDashboard(null)}
      />
    );
  }

  const openDashboard = (dashboard: DashboardItem) => {
    if (dashboard.status === "available") setActiveDashboard(dashboard.id);
  };

  const FeaturedIcon = featured.icon;

  return (
    <section className="bn-dashboard-hub" aria-labelledby="bn-dashboard-title">
      <div className="bn-dashboard-hub__inner">
        <div className="bn-dashboard-hub__masthead">
          <span>BHARATNOMY <i>·</i> DATA & RESEARCH</span>
          <span className="bn-dashboard-hub__masthead-right">
            <span className="bn-dashboard-hub__live-dot" />
            {String(availableCount).padStart(2, "0")} LIVE WORKSPACE
          </span>
        </div>

        <header className="bn-dashboard-hero">
          <div className="bn-dashboard-hero__copy">
            <p className="bn-dashboard-kicker">
              <span>BN-DASH</span>
              <span className="bn-dashboard-kicker__rule" />
              INTERACTIVE WORKSPACE
            </p>
            <h1 id="bn-dashboard-title">
              Data, made<br />
              <span>explorable.</span>
            </h1>
            <p className="bn-dashboard-hero__description">
              Independent, evidence-led dashboards for exploring India’s changing
              landscapes — from climate and resources to the economy.
            </p>
          </div>

          <aside className="bn-dashboard-hero__aside" aria-label="Dashboard collection information">
            <div className="bn-dashboard-hero__aside-icon">
              <Layers3 size={20} strokeWidth={1.4} />
            </div>
            <p className="bn-dashboard-hero__aside-label">THE COLLECTION</p>
            <p className="bn-dashboard-hero__aside-number">
              {String(dashboards.length).padStart(2, "0")}
            </p>
            <p className="bn-dashboard-hero__aside-note">
              Research workspaces<br />and interactive tools
            </p>
            <div className="bn-dashboard-hero__aside-bottom">
              <span>UPDATED AS NEW TOOLS ARRIVE</span>
              <ArrowDownMark />
            </div>
          </aside>
        </header>

        <div className="bn-dashboard-section-bar">
          <span><b>01</b> / FEATURED WORKSPACE</span>
          <span>SELECT A DASHBOARD TO EXPLORE <ArrowUpRight size={12} /></span>
        </div>

        <button
          className="bn-dashboard-featured"
          type="button"
          onClick={() => openDashboard(featured)}
          aria-label={`Open ${featured.title} dashboard`}
        >
          <div className="bn-dashboard-featured__visual" aria-hidden="true">
            <div className="bn-dashboard-featured__visual-top">
              <span>BHARATNOMY / CLIMATE ATLAS</span>
              <span>MAHARASHTRA · INDIA</span>
            </div>
            <div className="bn-dashboard-featured__map-art">
              <div className="bn-dashboard-featured__map-ring bn-dashboard-featured__map-ring--one" />
              <div className="bn-dashboard-featured__map-ring bn-dashboard-featured__map-ring--two" />
              <div className="bn-dashboard-featured__map-ring bn-dashboard-featured__map-ring--three" />
              <div className="bn-dashboard-featured__map-core">
                <FeaturedIcon size={34} strokeWidth={1.15} />
              </div>
              <span className="bn-dashboard-featured__map-coordinate">19° 45′ N / 75° 42′ E</span>
              <span className="bn-dashboard-featured__map-label">DISTRICT-LEVEL CLIMATE DATA</span>
            </div>
            <div className="bn-dashboard-featured__visual-bottom">
              <span>35 DISTRICTS</span>
              <span>1951 — 2024</span>
              <span>CLIMATE SERIES / 01</span>
            </div>
          </div>

          <div className="bn-dashboard-featured__content">
            <div className="bn-dashboard-featured__topline">
              <span className="bn-dashboard-number">{featured.number} / AVAILABLE DASHBOARD</span>
              <span className="bn-dashboard-status"><span /> LIVE</span>
            </div>
            <div className="bn-dashboard-featured__main">
              <div>
                <p className="bn-dashboard-kicker">{featured.eyebrow}</p>
                <h2>{featured.title}<span>.</span></h2>
                <p className="bn-dashboard-featured__description">{featured.description}</p>
              </div>
              <span className="bn-dashboard-open-mark" aria-hidden="true">
                <ArrowUpRight size={25} strokeWidth={1.5} />
              </span>
            </div>
            <div className="bn-dashboard-featured__bottom">
              <span className="bn-dashboard-featured__category"><MapPinned size={13} /> {featured.category}</span>
              <span>{featured.meta}</span>
              <span className="bn-dashboard-featured__action">OPEN DASHBOARD <ArrowRight size={13} /></span>
            </div>
          </div>
        </button>

        <div className="bn-dashboard-section-bar bn-dashboard-section-bar--upcoming">
          <span><b>02</b> / IN THE PIPELINE</span>
          <span>MORE RESEARCH WORKSPACES</span>
        </div>

        <div className="bn-dashboard-upcoming-grid">
          {upcoming.map((dashboard) => {
            const Icon = dashboard.icon;
            return (
              <article className="bn-dashboard-upcoming" key={dashboard.id}>
                <div className="bn-dashboard-upcoming__top">
                  <span>{dashboard.number} / {dashboard.category.toUpperCase()}</span>
                  <Clock3 size={14} strokeWidth={1.5} />
                </div>
                <div className="bn-dashboard-upcoming__middle">
                  <div className="bn-dashboard-upcoming__icon"><Icon size={21} strokeWidth={1.4} /></div>
                  <span className="bn-dashboard-upcoming__status">IN DEVELOPMENT</span>
                </div>
                <p className="bn-dashboard-kicker">{dashboard.eyebrow}</p>
                <h3>{dashboard.title}</h3>
                <p className="bn-dashboard-upcoming__description">{dashboard.description}</p>
                <div className="bn-dashboard-upcoming__bottom">
                  <span>{dashboard.meta}</span>
                  <span>COMING SOON</span>
                </div>
              </article>
            );
          })}
          <div className="bn-dashboard-add-card">
            <div className="bn-dashboard-add-card__icon"><Plus size={19} strokeWidth={1.4} /></div>
            <p className="bn-dashboard-kicker">GROWING COLLECTION</p>
            <h3>Room for<br />what’s next.</h3>
            <p>New datasets and interactive research tools will be added to this workspace.</p>
            <span>BHARATNOMY / BN-DASH</span>
          </div>
        </div>

        <footer className="bn-dashboard-hub__footer">
          <span>BHARATNOMY <i>·</i> RESEARCH THROUGH DATA</span>
          <span>INDEPENDENT. EVIDENCE-LED. OPEN. <ArrowUpRight size={12} /></span>
        </footer>
      </div>

      <style>{`
        .bn-dashboard-hub {
          --hub-paper: var(--paper, #F2F3EF);
          --hub-card: var(--paper-raised, #FBFBF8);
          --hub-ink: var(--ink, #16181C);
          --hub-soft: var(--ink-soft, #4C535C);
          --hub-line: rgba(22, 24, 28, .23);
          --hub-blue: var(--accent, #2346C7);
          width: 100%;
          min-height: 76vh;
          padding: clamp(25px, 4.5vw, 58px) clamp(16px, 4vw, 40px) 38px;
          color: var(--hub-ink);
          background-color: var(--hub-paper);
          background-image:
            linear-gradient(rgba(22,24,28,.035) 1px, transparent 1px),
            linear-gradient(90deg, rgba(22,24,28,.035) 1px, transparent 1px);
          background-size: 32px 32px;
          font-family: var(--f-text, 'Geist', system-ui, sans-serif);
        }
        .bn-dashboard-hub *, .bn-dashboard-view * { box-sizing: border-box; }
        .bn-dashboard-hub__inner { width: min(100%, 1320px); margin: 0 auto; }
        .bn-dashboard-hub__masthead, .bn-dashboard-section-bar, .bn-dashboard-hub__footer {
          display: flex; justify-content: space-between; align-items: center; gap: 14px;
          font: 500 9px/1.5 var(--f-mono, 'Geist Mono', monospace); letter-spacing: .11em;
        }
        .bn-dashboard-hub__masthead { padding-bottom: 11px; border-bottom: 1px solid var(--hub-ink); }
        .bn-dashboard-hub__masthead i, .bn-dashboard-hub__footer i { color: var(--hub-blue); font-style: normal; padding: 0 4px; }
        .bn-dashboard-hub__masthead-right { display: inline-flex; align-items: center; gap: 8px; color: var(--hub-soft); }
        .bn-dashboard-hub__live-dot, .bn-dashboard-status > span { width: 6px; height: 6px; border-radius: 50%; background: #43845A; display: inline-block; }
        .bn-dashboard-hero { display: grid; grid-template-columns: minmax(0, 1fr) 190px; gap: 35px; align-items: end; padding: clamp(38px, 6vw, 76px) 0 clamp(34px, 5vw, 58px); }
        .bn-dashboard-kicker { display: flex; align-items: center; gap: 9px; margin: 0; color: var(--hub-soft); font: 500 9px/1.5 var(--f-mono, 'Geist Mono', monospace); letter-spacing: .12em; }
        .bn-dashboard-kicker > span:first-child { color: var(--hub-blue); }
        .bn-dashboard-kicker__rule { width: 26px; height: 1px; background: var(--hub-line); }
        .bn-dashboard-hero h1 { margin: 17px 0 18px; font: 800 clamp(62px, 10vw, 124px)/.82 var(--f-display, 'Big Shoulders Display', sans-serif); letter-spacing: -.035em; text-transform: uppercase; }
        .bn-dashboard-hero h1 span { color: var(--hub-blue); }
        .bn-dashboard-hero__description { max-width: 540px; margin: 0; color: var(--hub-soft); font-size: clamp(13px, 1.35vw, 16px); line-height: 1.7; }
        .bn-dashboard-hero__aside { min-height: 190px; display: flex; flex-direction: column; align-items: flex-start; padding: 16px; border: 1px solid var(--hub-line); background: color-mix(in srgb, var(--hub-card) 72%, transparent); }
        .bn-dashboard-hero__aside-icon { display: grid; place-items: center; width: 32px; height: 32px; border: 1px solid var(--hub-line); color: var(--hub-blue); }
        .bn-dashboard-hero__aside-label { margin: 16px 0 0; color: var(--hub-soft); font: 500 9px var(--f-mono, monospace); letter-spacing: .12em; }
        .bn-dashboard-hero__aside-number { margin: 3px 0 0; font: 700 46px/.95 var(--f-display, sans-serif); }
        .bn-dashboard-hero__aside-note { margin: 5px 0 15px; color: var(--hub-soft); font-size: 11px; line-height: 1.5; }
        .bn-dashboard-hero__aside-bottom { display: flex; align-items: center; justify-content: space-between; width: 100%; margin-top: auto; padding-top: 10px; border-top: 1px solid var(--hub-line); color: var(--hub-soft); font: 500 7px var(--f-mono, monospace); letter-spacing: .07em; }
        .bn-dashboard-section-bar { padding: 11px 0; border-top: 1px solid var(--hub-ink); border-bottom: 1px solid var(--hub-line); color: var(--hub-soft); }
        .bn-dashboard-section-bar b { color: var(--hub-blue); font-weight: 600; }
        .bn-dashboard-section-bar > span:last-child { display: inline-flex; align-items: center; gap: 7px; }
        .bn-dashboard-featured { display: grid; grid-template-columns: minmax(260px, .82fr) minmax(0, 1.18fr); width: 100%; padding: 0; margin-top: 18px; border: 1px solid var(--hub-line); border-radius: 0; background: var(--hub-card); color: var(--hub-ink); text-align: left; font: inherit; cursor: pointer; transition: border-color .2s ease, transform .2s ease, box-shadow .2s ease; }
        .bn-dashboard-featured:hover { transform: translateY(-3px); border-color: var(--hub-blue); box-shadow: 0 13px 30px rgba(22,24,28,.08); }
        .bn-dashboard-featured:focus-visible { outline: 2px solid var(--hub-blue); outline-offset: 4px; }
        .bn-dashboard-featured__visual { position: relative; display: flex; flex-direction: column; justify-content: space-between; min-height: 330px; overflow: hidden; padding: 15px 17px; color: #25372F; background: #DDE5D8; border-right: 1px solid var(--hub-line); }
        .bn-dashboard-featured__visual-top, .bn-dashboard-featured__visual-bottom { position: relative; z-index: 2; display: flex; justify-content: space-between; gap: 10px; font: 500 8px var(--f-mono, monospace); letter-spacing: .08em; }
        .bn-dashboard-featured__map-art { position: absolute; inset: 45px 20px 42px; display: grid; place-items: center; overflow: hidden; }
        .bn-dashboard-featured__map-ring { position: absolute; width: min(72%, 270px); aspect-ratio: 1; border: 1px solid rgba(37,55,47,.24); border-radius: 48% 52% 61% 39% / 44% 38% 62% 56%; transform: rotate(-24deg); }
        .bn-dashboard-featured__map-ring--one { width: min(55%, 205px); }
        .bn-dashboard-featured__map-ring--two { width: min(75%, 280px); transform: rotate(27deg); border-style: dashed; }
        .bn-dashboard-featured__map-ring--three { width: min(95%, 350px); transform: rotate(-8deg); opacity: .55; }
        .bn-dashboard-featured__map-core { position: relative; display: grid; place-items: center; width: 78px; height: 78px; border: 1px solid rgba(37,55,47,.5); border-radius: 50%; color: #2346C7; background: rgba(251,251,248,.64); box-shadow: 0 0 0 9px rgba(251,251,248,.2); }
        .bn-dashboard-featured__map-coordinate, .bn-dashboard-featured__map-label { position: absolute; color: rgba(37,55,47,.75); font: 500 7px var(--f-mono, monospace); letter-spacing: .08em; }
        .bn-dashboard-featured__map-coordinate { top: 12%; left: 4%; }
        .bn-dashboard-featured__map-label { right: 2%; bottom: 12%; }
        .bn-dashboard-featured__content { display: flex; flex-direction: column; min-width: 0; padding: 18px 22px 0; }
        .bn-dashboard-featured__topline, .bn-dashboard-featured__bottom { display: flex; justify-content: space-between; align-items: center; flex-wrap: wrap; gap: 10px; }
        .bn-dashboard-number, .bn-dashboard-status { font: 500 9px var(--f-mono, monospace); letter-spacing: .09em; }
        .bn-dashboard-number { color: var(--hub-soft); }
        .bn-dashboard-status { display: inline-flex; align-items: center; gap: 7px; color: #39734E; }
        .bn-dashboard-featured__main { display: flex; justify-content: space-between; align-items: flex-end; gap: 15px; margin: auto 0; padding: 35px 0; }
        .bn-dashboard-featured__main .bn-dashboard-kicker { color: var(--hub-blue); }
        .bn-dashboard-featured__main h2 { margin: 12px 0 13px; font: 800 clamp(36px, 5.2vw, 65px)/.88 var(--f-display, sans-serif); text-transform: uppercase; letter-spacing: -.025em; }
        .bn-dashboard-featured__main h2 span { color: var(--hub-blue); }
        .bn-dashboard-featured__description { max-width: 510px; margin: 0; color: var(--hub-soft); font-size: 12px; line-height: 1.75; }
        .bn-dashboard-open-mark { flex: 0 0 auto; display: grid; place-items: center; width: 44px; height: 44px; border: 1px solid var(--hub-line); color: var(--hub-blue); transition: background .2s ease, color .2s ease; }
        .bn-dashboard-featured:hover .bn-dashboard-open-mark { color: white; background: var(--hub-blue); }
        .bn-dashboard-featured__bottom { margin-top: auto; min-height: 49px; border-top: 1px solid var(--hub-line); color: var(--hub-soft); font: 500 8px var(--f-mono, monospace); letter-spacing: .06em; }
        .bn-dashboard-featured__category { display: inline-flex; align-items: center; gap: 6px; color: var(--hub-ink); }
        .bn-dashboard-featured__action { display: inline-flex; align-items: center; gap: 7px; color: var(--hub-blue); }
        .bn-dashboard-section-bar--upcoming { margin-top: 38px; }
        .bn-dashboard-upcoming-grid { display: grid; grid-template-columns: repeat(3, minmax(0, 1fr)); gap: 14px; padding-top: 16px; }
        .bn-dashboard-upcoming, .bn-dashboard-add-card { min-width: 0; min-height: 220px; padding: 16px; border: 1px solid var(--hub-line); background: color-mix(in srgb, var(--hub-card) 76%, transparent); }
        .bn-dashboard-upcoming { display: flex; flex-direction: column; }
        .bn-dashboard-upcoming__top, .bn-dashboard-upcoming__bottom { display: flex; justify-content: space-between; align-items: center; gap: 8px; color: var(--hub-soft); font: 500 8px var(--f-mono, monospace); letter-spacing: .08em; }
        .bn-dashboard-upcoming__middle { display: flex; justify-content: space-between; align-items: center; margin: 19px 0 15px; }
        .bn-dashboard-upcoming__icon, .bn-dashboard-add-card__icon { display: grid; place-items: center; width: 36px; height: 36px; border: 1px solid var(--hub-line); color: var(--hub-blue); }
        .bn-dashboard-upcoming__status { color: var(--hub-soft); font: 500 8px var(--f-mono, monospace); letter-spacing: .08em; }
        .bn-dashboard-upcoming > .bn-dashboard-kicker { font-size: 8px; }
        .bn-dashboard-upcoming h3, .bn-dashboard-add-card h3 { margin: 7px 0 8px; font: 700 clamp(25px, 2.5vw, 34px)/.95 var(--f-display, sans-serif); text-transform: uppercase; }
        .bn-dashboard-upcoming__description, .bn-dashboard-add-card > p:not(.bn-dashboard-kicker) { margin: 0 0 14px; color: var(--hub-soft); font-size: 10px; line-height: 1.6; }
        .bn-dashboard-upcoming__bottom { margin-top: auto; padding-top: 11px; border-top: 1px solid var(--hub-line); }
        .bn-dashboard-add-card { display: flex; flex-direction: column; justify-content: center; border-style: dashed; background: transparent; }
        .bn-dashboard-add-card__icon { margin-bottom: 16px; }
        .bn-dashboard-add-card .bn-dashboard-kicker { font-size: 8px; }
        .bn-dashboard-add-card h3 { margin-top: 8px; }
        .bn-dashboard-add-card > p:not(.bn-dashboard-kicker) { max-width: 31ch; }
        .bn-dashboard-add-card > span { margin-top: auto; padding-top: 10px; color: var(--hub-soft); font: 500 7px var(--f-mono, monospace); letter-spacing: .09em; }
        .bn-dashboard-hub__footer { margin-top: 38px; padding-top: 12px; border-top: 1px solid var(--hub-ink); color: var(--hub-soft); }
        .bn-dashboard-hub__footer > span:last-child { display: inline-flex; align-items: center; gap: 7px; }
        .bn-dashboard-view { width: 100%; }
        .bn-dashboard-back { display: inline-flex; align-items: center; gap: 8px; margin: 14px 16px; padding: 9px 12px; border: 1px solid var(--hub-line, rgba(22,24,28,.23)); background: var(--paper-raised, #FBFBF8); color: var(--ink, #16181C); font: 500 10px var(--f-mono, monospace); letter-spacing: .04em; text-transform: uppercase; cursor: pointer; }
        .bn-dashboard-back:hover { border-color: var(--accent, #2346C7); color: var(--accent, #2346C7); }
        html[data-theme="dark"] .bn-dashboard-featured__visual { color: #DCE7DA; background: #25352E; }
        html[data-theme="dark"] .bn-dashboard-featured__map-ring { border-color: rgba(220,231,218,.24); }
        html[data-theme="dark"] .bn-dashboard-featured__map-core { color: #B4C4FF; background: rgba(17,20,24,.72); border-color: rgba(220,231,218,.42); }
        html[data-theme="dark"] .bn-dashboard-featured__map-coordinate, html[data-theme="dark"] .bn-dashboard-featured__map-label { color: rgba(220,231,218,.76); }
        @media (max-width: 820px) {
          .bn-dashboard-hero { grid-template-columns: minmax(0, 1fr) 155px; gap: 20px; }
          .bn-dashboard-featured { grid-template-columns: minmax(220px, .75fr) minmax(0, 1.25fr); }
          .bn-dashboard-featured__visual { min-height: 300px; }
          .bn-dashboard-upcoming-grid { grid-template-columns: repeat(2, minmax(0, 1fr)); }
          .bn-dashboard-add-card { min-height: 200px; }
        }
        @media (max-width: 600px) {
          .bn-dashboard-hub { padding-inline: 14px; }
          .bn-dashboard-hero { grid-template-columns: 1fr; padding-top: 42px; }
          .bn-dashboard-hero__aside { display: grid; grid-template-columns: 38px 1fr auto; align-items: center; gap: 8px 12px; min-height: 0; }
          .bn-dashboard-hero__aside-icon { grid-row: span 2; }
          .bn-dashboard-hero__aside-label { margin: 0; }
          .bn-dashboard-hero__aside-number { grid-column: 3; grid-row: 1 / span 2; margin: 0; }
          .bn-dashboard-hero__aside-note, .bn-dashboard-hero__aside-bottom { display: none; }
          .bn-dashboard-section-bar { align-items: flex-start; font-size: 8px; }
          .bn-dashboard-section-bar > span:last-child { max-width: 48%; text-align: right; justify-content: flex-end; }
          .bn-dashboard-featured { grid-template-columns: 1fr; }
          .bn-dashboard-featured__visual { min-height: 230px; border-right: 0; border-bottom: 1px solid var(--hub-line); }
          .bn-dashboard-featured__content { min-height: 285px; padding-inline: 15px; }
          .bn-dashboard-featured__main { padding: 30px 0; }
          .bn-dashboard-featured__main h2 { font-size: clamp(38px, 12vw, 56px); }
          .bn-dashboard-featured__bottom { font-size: 7px; }
          .bn-dashboard-upcoming-grid { grid-template-columns: 1fr; }
          .bn-dashboard-upcoming, .bn-dashboard-add-card { min-height: 195px; }
          .bn-dashboard-hub__footer { align-items: flex-start; flex-direction: column; font-size: 8px; }
        }
        @media (prefers-reduced-motion: reduce) {
          .bn-dashboard-featured, .bn-dashboard-open-mark { transition: none; }
        }
      `}</style>
    </section>
  );
}

function ArrowDownMark() {
  return <ArrowRight size={11} strokeWidth={1.5} />;
}
