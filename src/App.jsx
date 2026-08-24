import { useEffect, useState } from "react";
import Overview from "./views/Overview.jsx";
import Community from "./views/Community.jsx";
import DataNotes from "./views/DataNotes.jsx";
import "./index.css";

// Hash routing so deep links work on static hosting:
//   #/overview   #/community/Houlton   #/notes
function parseHash() {
  const h = decodeURIComponent(window.location.hash.replace(/^#\/?/, ""));
  const [page, arg] = h.split("/");
  return { page: page || "overview", arg: arg || null };
}

export default function App() {
  const [data, setData] = useState(null);
  const [error, setError] = useState(null);
  const [route, setRoute] = useState(parseHash());

  useEffect(() => {
    fetch(import.meta.env.BASE_URL + "data/dashboard_data.json")
      .then((r) => (r.ok ? r.json() : Promise.reject(new Error(r.statusText))))
      .then(setData)
      .catch((e) => setError(String(e)));
    const onHash = () => setRoute(parseHash());
    window.addEventListener("hashchange", onHash);
    return () => window.removeEventListener("hashchange", onHash);
  }, []);

  if (error) return <div className="loading">Failed to load data: {error}</div>;
  if (!data) return <div className="loading">Loading dashboard…</div>;

  const go = (hash) => (window.location.hash = hash);
  const geos = [data.meta.region, ...data.meta.communities];
  const activeGeo =
    route.page === "community" && geos.includes(route.arg)
      ? route.arg
      : data.meta.region;

  return (
    <div className="app">
      <header className="masthead">
        <div className="masthead-inner">
          <div>
            <div className="eyebrow">GrowSmart Maine · Roadmaps for Growth</div>
            <h1>Rural Prosperity Scorecard</h1>
          </div>
          <button className="print-btn" onClick={() => window.print()}>
            Print scorecard
          </button>
        </div>
        <nav className="tabs">
          <button
            className={route.page === "overview" ? "active" : ""}
            onClick={() => go("#/overview")}
          >
            Program Overview
          </button>
          <button
            className={route.page === "community" ? "active" : ""}
            onClick={() => go("#/community/" + activeGeo)}
          >
            Community Scorecard
          </button>
          <button
            className={route.page === "notes" ? "active" : ""}
            onClick={() => go("#/notes")}
          >
            Data Notes
          </button>
        </nav>
        {route.page === "community" && (
          <div className="geo-pills">
            {geos.map((g) => (
              <button
                key={g}
                className={g === activeGeo ? "pill active" : "pill"}
                onClick={() => go("#/community/" + g)}
              >
                {g}
              </button>
            ))}
          </div>
        )}
      </header>

      <main>
        {route.page === "overview" && (
          <Overview data={data} onSelect={(c) => go("#/community/" + c)} />
        )}
        {route.page === "community" && <Community data={data} geo={activeGeo} />}
        {route.page === "notes" && <DataNotes data={data} />}
      </main>

      <footer>
        Prepared by Camoin Associates with North Star Planning for GrowSmart
        Maine · Data sources and limitations under{" "}
        <a href="#/notes">Data Notes</a>
      </footer>
    </div>
  );
}
