"use client";

import { useEffect, useState, useMemo } from "react";
import { useRouter } from "next/navigation";

type Station = {
  _id: string;
  nom: string;
  ville?: string;
  altitude?: number;
  type?: string;
  region?: string;
};

type Releve = {
  _id: string;
  station_id: string;
  timestamp: string;
  type?: string;
  meteo: {
    temperature?: { valeur: number };
    precipitation?: { valeur: number };
    vent?: { vitesse: number; direction?: string };
    enneigement?: { valeur: number; unite: string };
    hauteur_vagues?: { valeur: number };
    qualite_air?: { indice: number; categorie: string };
    indice_uv?: number;
  };
};

const TYPE_BADGES: Record<string, string> = {
  urbaine:         "bg-sky-100 text-sky-800",
  montagne:        "bg-indigo-100 text-indigo-800",
  "côtière":       "bg-cyan-100 text-cyan-800",
  méditerranéenne: "bg-orange-100 text-orange-800",
};

const RELEVE_TYPE_BADGES: Record<string, string> = {
  mesure:    "bg-emerald-100 text-emerald-800",
  prevision: "bg-violet-100 text-violet-800",
};

const inputClass =
  "bg-white border border-slate-200 rounded-lg px-2.5 py-1.5 text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-slate-300 focus:border-slate-400 transition";

export default function Home() {
  const [stations, setStations]               = useState<Station[]>([]);
  const [selectedStation, setSelectedStation] = useState<Station | null>(null);
  const [releves, setReleves]                 = useState<Releve[]>([]);
  const [loadingStations, setLoadingStations] = useState(true);
  const [loadingReleves, setLoadingReleves]   = useState(false);
  const [syncing, setSyncing]                 = useState(false);
  const [syncMsg, setSyncMsg]                 = useState<{ ok: boolean; text: string } | null>(null);

  // ── Filtres ───────────────────────────────────────────
  const [filterType,    setFilterType]    = useState("");
  const [filterDateMin, setFilterDateMin] = useState("");
  const [filterDateMax, setFilterDateMax] = useState("");
  const [filterTempMin, setFilterTempMin] = useState("");
  const [filterTempMax, setFilterTempMax] = useState("");
  const [filtersOpen,   setFiltersOpen]   = useState(false);

  const router = useRouter();

  // ── Charger stations ──────────────────────────────────
  useEffect(() => {
    const fetchStations = async () => {
      try {
        const res  = await fetch("/api/stations");
        const data = await res.json();
        setStations(Array.isArray(data) ? data : []);
      } catch (err) {
        console.error(err);
      } finally {
        setLoadingStations(false);
      }
    };
    fetchStations();
  }, []);

  // ── Charger relevés ───────────────────────────────────
  async function handleSelectStation(station: Station) {
    setSelectedStation(station);
    setLoadingReleves(true);
    setReleves([]);
    setSyncMsg(null);
    resetFilters();
    try {
      const res  = await fetch(`/api/releves?station_id=${station._id}`);
      const data = await res.json();
      setReleves(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoadingReleves(false);
    }
  }

  function resetFilters() {
    setFilterType("");
    setFilterDateMin("");
    setFilterDateMax("");
    setFilterTempMin("");
    setFilterTempMax("");
  }

  // ── Synchronisation Open-Meteo ────────────────────────
  async function handleSync() {
    if (!selectedStation) return;
    setSyncing(true);
    setSyncMsg(null);
    try {
      const res  = await fetch(`/api/stations/${selectedStation._id}/sync`, { method: "POST" });
      const data = await res.json();
      if (!res.ok) {
        setSyncMsg({ ok: false, text: data.error ?? "Erreur de synchronisation" });
        return;
      }
      setSyncMsg({ ok: true, text: "Relevé synchronisé avec Open-Meteo ✅" });
      // Recharge les relevés pour afficher le nouveau
      const res2  = await fetch(`/api/releves?station_id=${selectedStation._id}`);
      const data2 = await res2.json();
      setReleves(Array.isArray(data2) ? data2 : []);
    } catch {
      setSyncMsg({ ok: false, text: "Erreur réseau lors de la synchronisation" });
    } finally {
      setSyncing(false);
    }
  }

  // ── Filtrage en mémoire ───────────────────────────────
  const relevesFiltres = useMemo(() => {
    return releves.filter((r) => {
      if (filterType && r.type !== filterType) return false;

      const ts = new Date(r.timestamp);
      if (filterDateMin && ts < new Date(filterDateMin))               return false;
      if (filterDateMax && ts > new Date(filterDateMax + "T23:59:59")) return false;

      const temp = r.meteo.temperature?.valeur;
      if (filterTempMin !== "" && (temp === undefined || temp < Number(filterTempMin))) return false;
      if (filterTempMax !== "" && (temp === undefined || temp > Number(filterTempMax))) return false;

      return true;
    });
  }, [releves, filterType, filterDateMin, filterDateMax, filterTempMin, filterTempMax]);

  const activeFilterCount = [filterType, filterDateMin, filterDateMax, filterTempMin, filterTempMax]
    .filter(Boolean).length;

  // ── Supprimer station ─────────────────────────────────
  async function deleteStation(id: string) {
    await fetch(`/api/stations/${id}`, { method: "DELETE" });
    setStations((prev) => prev.filter((s) => s._id !== id));
    if (selectedStation?._id === id) {
      setSelectedStation(null);
      setReleves([]);
    }
  }

  // ── Supprimer relevé ──────────────────────────────────
  async function deleteReleve(id: string) {
    await fetch(`/api/releves/${id}`, { method: "DELETE" });
    setReleves((prev) => prev.filter((r) => r._id !== id));
  }

  return (
    <main className="min-h-screen bg-slate-100 p-6">
      <div className="max-w-6xl mx-auto">

        {/* HEADER */}
        <div className="mb-6">
          <h1 className="text-3xl font-bold text-slate-900">🌤 Plateforme météorologique</h1>
          <p className="text-slate-500 mt-1 text-sm">Gestion des stations et des relevés météo</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">

          {/* ══════════════════════════════════════════════
              COLONNE STATIONS
          ══════════════════════════════════════════════ */}
          <section>
            <div className="flex justify-between items-center mb-3">
              <h2 className="text-lg font-semibold text-slate-800">Stations</h2>
              <button
                onClick={() => router.push("/stations/new")}
                className="flex items-center gap-1.5 bg-slate-800 text-white text-sm px-3 py-1.5 rounded-lg hover:bg-slate-700 transition cursor-pointer"
              >
                <span>＋</span> Nouvelle station
              </button>
            </div>

            {loadingStations ? (
              <div className="text-slate-500 text-sm py-8 text-center">Chargement…</div>
            ) : stations.length === 0 ? (
              <div className="text-slate-500 text-sm py-8 text-center">Aucune station enregistrée.</div>
            ) : (
              <div className="space-y-2">
                {stations.map((station) => {
                  const isSelected = selectedStation?._id === station._id;
                  return (
                    <div
                      key={station._id}
                      className={`bg-white rounded-xl border transition cursor-pointer ${
                        isSelected
                          ? "border-slate-400 ring-2 ring-slate-200"
                          : "border-slate-200 hover:border-slate-300 hover:shadow-sm"
                      }`}
                    >
                      <div className="p-4" onClick={() => handleSelectStation(station)}>
                        <div className="flex justify-between items-start">
                          <div className="flex-1 min-w-0 pr-3">
                            <p className="font-semibold text-slate-900 truncate">{station.nom}</p>
                            <p className="text-sm text-slate-500 mt-0.5">
                              {station.region ?? station.ville}
                              {station.altitude !== undefined && (
                                <span className="ml-2 text-slate-400">· {station.altitude} m</span>
                              )}
                            </p>
                            {station.type && (
                              <span className={`inline-block mt-1.5 text-xs font-medium px-2 py-0.5 rounded-full ${TYPE_BADGES[station.type] ?? "bg-slate-100 text-slate-700"}`}>
                                {station.type}
                              </span>
                            )}
                          </div>
                          <div className="flex gap-1.5 shrink-0" onClick={(e) => e.stopPropagation()}>
                            <button
                              onClick={() => router.push(`/stations/${station._id}/edit`)}
                              className="bg-amber-50 hover:bg-amber-100 text-amber-700 border border-amber-200 px-2.5 py-1.5 rounded-lg text-sm transition cursor-pointer"
                              title="Modifier"
                            >✏️</button>
                            <button
                              onClick={() => deleteStation(station._id)}
                              className="bg-red-50 hover:bg-red-100 text-red-700 border border-red-200 px-2.5 py-1.5 rounded-lg text-sm transition cursor-pointer"
                              title="Supprimer"
                            >🗑</button>
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </section>

          {/* ══════════════════════════════════════════════
              COLONNE DÉTAILS / RELEVÉS
          ══════════════════════════════════════════════ */}
          <section>
            {!selectedStation ? (
              <div className="flex flex-col items-center justify-center h-48 text-slate-400 bg-white rounded-xl border border-slate-200 border-dashed">
                <span className="text-3xl mb-2">📍</span>
                <p className="text-sm">Sélectionne une station</p>
              </div>
            ) : (
              <>
                {/* ── Fiche station ───────────────────── */}
                <div className="bg-white rounded-xl border border-slate-200 p-4 mb-3">
                  <div className="flex justify-between items-start">
                    <div>
                      <h2 className="text-lg font-semibold text-slate-900">{selectedStation.nom}</h2>
                      {selectedStation.region && (
                        <p className="text-sm text-slate-500 mt-0.5">{selectedStation.region}</p>
                      )}
                      <div className="flex gap-3 mt-2 text-sm text-slate-600 flex-wrap">
                        {selectedStation.altitude !== undefined && (
                          <span>⛰ {selectedStation.altitude} m</span>
                        )}
                        {selectedStation.type && (
                          <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${TYPE_BADGES[selectedStation.type] ?? "bg-slate-100 text-slate-700"}`}>
                            {selectedStation.type}
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Actions fiche */}
                    <div className="flex gap-2 shrink-0">
                      <button
                        onClick={() => router.push(`/releves/${selectedStation._id}/new`)}
                        className="flex items-center gap-1.5 bg-slate-800 text-white text-sm px-3 py-1.5 rounded-lg hover:bg-slate-700 transition cursor-pointer"
                      >
                        <span>＋</span> Relevé
                      </button>
                      <button
                        onClick={handleSync}
                        disabled={syncing}
                        className="flex items-center gap-1.5 bg-sky-600 hover:bg-sky-700 disabled:bg-sky-400 text-white text-sm px-3 py-1.5 rounded-lg transition cursor-pointer"
                        title="Synchroniser depuis Open-Meteo"
                      >
                        {syncing ? "…" : "🔄"} Sync
                      </button>
                    </div>
                  </div>

                  {/* Message sync */}
                  {syncMsg && (
                    <div className={`mt-3 text-xs px-3 py-2 rounded-lg ${
                      syncMsg.ok
                        ? "bg-emerald-50 text-emerald-700 border border-emerald-200"
                        : "bg-red-50 text-red-700 border border-red-200"
                    }`}>
                      {syncMsg.text}
                    </div>
                  )}
                </div>

                {/* ── Barre de filtres ────────────────── */}
                <div className="bg-white rounded-xl border border-slate-200 mb-3">
                  <button
                    onClick={() => setFiltersOpen((v) => !v)}
                    className="w-full flex items-center justify-between px-4 py-2.5 text-sm text-slate-700 hover:bg-slate-50 rounded-xl transition cursor-pointer"
                  >
                    <span className="font-medium flex items-center gap-2">
                      🔍 Filtres
                      {activeFilterCount > 0 && (
                        <span className="bg-slate-800 text-white text-xs font-semibold px-1.5 py-0.5 rounded-full">
                          {activeFilterCount}
                        </span>
                      )}
                    </span>
                    <span className="text-slate-400 text-xs">{filtersOpen ? "▲" : "▼"}</span>
                  </button>

                  {filtersOpen && (
                    <div className="px-4 pb-4 border-t border-slate-100 pt-3 space-y-3">

                      {/* Type */}
                      <div>
                        <p className="text-xs font-medium text-slate-500 mb-1.5">Type de relevé</p>
                        <div className="flex gap-2">
                          {["", "mesure", "prevision"].map((v) => (
                            <button
                              key={v}
                              onClick={() => setFilterType(v)}
                              className={`px-3 py-1 rounded-lg border text-xs font-medium transition cursor-pointer ${
                                filterType === v
                                  ? v === "mesure"
                                    ? "bg-emerald-100 text-emerald-800 border-emerald-200"
                                    : v === "prevision"
                                    ? "bg-violet-100 text-violet-800 border-violet-200"
                                    : "bg-slate-800 text-white border-slate-800"
                                  : "bg-white border-slate-200 text-slate-600 hover:bg-slate-50"
                              }`}
                            >
                              {v === "" ? "Tous" : v === "mesure" ? "Mesure" : "Prévision"}
                            </button>
                          ))}
                        </div>
                      </div>

                      {/* Période */}
                      <div>
                        <p className="text-xs font-medium text-slate-500 mb-1.5">Période</p>
                        <div className="flex items-center gap-2">
                          <input type="date" className={`${inputClass} flex-1`} value={filterDateMin} onChange={(e) => setFilterDateMin(e.target.value)} />
                          <span className="text-slate-400 text-xs">→</span>
                          <input type="date" className={`${inputClass} flex-1`} value={filterDateMax} onChange={(e) => setFilterDateMax(e.target.value)} />
                        </div>
                      </div>

                      {/* Température */}
                      <div>
                        <p className="text-xs font-medium text-slate-500 mb-1.5">Température (°C)</p>
                        <div className="flex items-center gap-2">
                          <input type="number" step="0.1" placeholder="Min" className={`${inputClass} flex-1`} value={filterTempMin} onChange={(e) => setFilterTempMin(e.target.value)} />
                          <span className="text-slate-400 text-xs">→</span>
                          <input type="number" step="0.1" placeholder="Max" className={`${inputClass} flex-1`} value={filterTempMax} onChange={(e) => setFilterTempMax(e.target.value)} />
                        </div>
                      </div>

                      {activeFilterCount > 0 && (
                        <button
                          onClick={resetFilters}
                          className="text-xs text-slate-500 hover:text-slate-700 underline underline-offset-2 transition cursor-pointer"
                        >
                          Réinitialiser les filtres
                        </button>
                      )}
                    </div>
                  )}
                </div>

                {/* ── Compteur ────────────────────────── */}
                <div className="flex items-center justify-between mb-2">
                  <h3 className="text-sm font-semibold text-slate-700 uppercase tracking-wide">
                    Relevés météo
                  </h3>
                  <span className="text-xs text-slate-400">
                    {relevesFiltres.length !== releves.length
                      ? `${relevesFiltres.length} / ${releves.length} relevé${releves.length > 1 ? "s" : ""}`
                      : `${releves.length} relevé${releves.length > 1 ? "s" : ""}`}
                  </span>
                </div>

                {/* ── Liste relevés ────────────────────── */}
                {loadingReleves ? (
                  <div className="text-slate-500 text-sm py-8 text-center">Chargement…</div>
                ) : relevesFiltres.length === 0 ? (
                  <div className="text-slate-500 text-sm py-8 text-center bg-white rounded-xl border border-dashed border-slate-200">
                    {releves.length === 0
                      ? "Aucun relevé pour cette station."
                      : "Aucun relevé ne correspond aux filtres."}
                  </div>
                ) : (
                  <div className="space-y-2">
                    {relevesFiltres.map((r) => (
                      <div key={r._id} className="bg-white rounded-xl border border-slate-200 p-4">
                        <div className="flex justify-between items-start gap-3">

                          <div className="flex-1 min-w-0">
                            {/* Date + badge type */}
                            <div className="flex items-center gap-2 mb-2">
                              <p className="text-xs text-slate-500">
                                {new Date(r.timestamp).toLocaleString("fr-FR", {
                                  day: "2-digit", month: "short", year: "numeric",
                                  hour: "2-digit", minute: "2-digit",
                                })}
                              </p>
                              {r.type && (
                                <span className={`text-xs font-medium px-1.5 py-0.5 rounded-full ${RELEVE_TYPE_BADGES[r.type] ?? "bg-slate-100 text-slate-700"}`}>
                                  {r.type}
                                </span>
                              )}
                            </div>

                            {/* Données principales */}
                            <div className="grid grid-cols-3 gap-x-4 gap-y-1 text-sm">
                              {r.meteo.temperature && (
                                <span className="text-slate-800 font-medium">
                                  🌡 {r.meteo.temperature.valeur}°C
                                </span>
                              )}
                              {r.meteo.precipitation && (
                                <span className="text-slate-700">
                                  🌧 {r.meteo.precipitation.valeur} mm
                                </span>
                              )}
                              {r.meteo.vent && (
                                <span className="text-slate-700">
                                  💨 {r.meteo.vent.vitesse} km/h
                                  {r.meteo.vent.direction && (
                                    <span className="text-slate-400 ml-1">{r.meteo.vent.direction}</span>
                                  )}
                                </span>
                              )}
                            </div>

                            {/* Champs spécifiques selon type de station */}
                            <div className="flex flex-wrap gap-x-4 gap-y-0.5 mt-1.5 text-xs text-slate-500">
                              {r.meteo.enneigement && (
                                <span>❄️ {r.meteo.enneigement.valeur} {r.meteo.enneigement.unite}</span>
                              )}
                              {r.meteo.hauteur_vagues && (
                                <span>🌊 {r.meteo.hauteur_vagues.valeur} m</span>
                              )}
                              {r.meteo.indice_uv !== undefined && (
                                <span>☀️ UV {r.meteo.indice_uv}</span>
                              )}
                              {r.meteo.qualite_air && (
                                <span>🍃 Air : {r.meteo.qualite_air.categorie}</span>
                              )}
                            </div>
                          </div>

                          {/* Actions */}
                          <div className="flex gap-1.5 shrink-0">
                            <button
                              onClick={() => router.push(`/releves/${r._id}/edit`)}
                              className="bg-amber-50 hover:bg-amber-100 text-amber-700 border border-amber-200 px-2.5 py-1.5 rounded-lg text-sm transition cursor-pointer"
                              title="Modifier"
                            >✏️</button>
                            <button
                              onClick={() => deleteReleve(r._id)}
                              className="bg-red-50 hover:bg-red-100 text-red-700 border border-red-200 px-2.5 py-1.5 rounded-lg text-sm transition cursor-pointer"
                              title="Supprimer"
                            >🗑</button>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </>
            )}
          </section>

        </div>
      </div>
    </main>
  );
}