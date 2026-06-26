"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";

const TYPES_RELEVE = [
  { value: "mesure",    label: "Mesure" },
  { value: "prevision", label: "Prévision" },
];

const DIRECTIONS = ["N", "NE", "E", "SE", "S", "SW", "W", "NW"];

export default function EditReleve() {
  const router = useRouter();
  const { id } = useParams();

  const [loading, setLoading]   = useState(true);
  const [saving, setSaving]     = useState(false);
  const [error, setError]       = useState<string | null>(null);
  const [type, setType]         = useState("mesure");
  const [timestamp, setTimestamp] = useState("");

  const [form, setForm] = useState({
    temperature:    "",
    precipitation:  "",
    vent_vitesse:   "",
    vent_direction: "",
    vent_rafales:   "",
    humidite:       "",
    pression:       "",
    indice_uv:      "",
    enneigement:    "",
    hauteur_vagues: "",
  });

  // ── Charger le relevé ─────────────────────────────────
  useEffect(() => {
    const load = async () => {
      try {
        const res = await fetch(`/api/releves/${id}`);
        if (!res.ok) throw new Error("Relevé introuvable");
        const data = await res.json();

        setType(data.type ?? "mesure");
        setTimestamp(data.timestamp ?? "");

        const m = data.meteo ?? {};
        setForm({
          temperature:    m.temperature?.valeur     !== undefined ? String(m.temperature.valeur)     : "",
          precipitation:  m.precipitation?.valeur   !== undefined ? String(m.precipitation.valeur)   : "",
          vent_vitesse:   m.vent?.vitesse            !== undefined ? String(m.vent.vitesse)            : "",
          vent_direction: m.vent?.direction          ?? "",
          vent_rafales:   m.vent?.rafales            !== undefined ? String(m.vent.rafales)            : "",
          humidite:       m.humidite                 !== undefined ? String(m.humidite)                : "",
          pression:       m.pression                 !== undefined ? String(m.pression)                : "",
          indice_uv:      m.indice_uv                !== undefined ? String(m.indice_uv)               : "",
          enneigement:    m.enneigement?.valeur      !== undefined ? String(m.enneigement.valeur)      : "",
          hauteur_vagues: m.hauteur_vagues?.valeur   !== undefined ? String(m.hauteur_vagues.valeur)   : "",
        });
      } catch (err) {
        setError((err as Error).message);
      } finally {
        setLoading(false);
      }
    };

    load();
  }, [id]);

  function field(key: keyof typeof form) {
    return (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) =>
      setForm({ ...form, [key]: e.target.value });
  }

  // ── Sauvegarder ───────────────────────────────────────
  async function handleUpdate(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    if (!form.temperature) {
      setError("La température est obligatoire.");
      return;
    }

    const meteo: Record<string, unknown> = {
      temperature: { valeur: Number(form.temperature), unite: "°C" },
    };

    if (form.precipitation !== "")
      meteo.precipitation = { valeur: Number(form.precipitation), unite: "mm" };

    if (form.vent_vitesse !== "") {
      meteo.vent = {
        vitesse: Number(form.vent_vitesse),
        ...(form.vent_direction && { direction: form.vent_direction }),
        ...(form.vent_rafales !== "" && { rafales: Number(form.vent_rafales) }),
      };
    }

    if (form.humidite      !== "") meteo.humidite      = Number(form.humidite);
    if (form.pression      !== "") meteo.pression      = Number(form.pression);
    if (form.indice_uv     !== "") meteo.indice_uv     = Number(form.indice_uv);
    if (form.enneigement   !== "") meteo.enneigement   = { valeur: Number(form.enneigement),   unite: "cm" };
    if (form.hauteur_vagues !== "") meteo.hauteur_vagues = { valeur: Number(form.hauteur_vagues), unite: "m" };

    setSaving(true);
    try {
      const res = await fetch(`/api/releves/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ type, meteo }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error ?? "Erreur lors de la mise à jour");
      }

      router.push("/");
    } catch (err) {
      setError((err as Error).message);
      setSaving(false);
    }
  }

  const inputClass =
    "w-full bg-white border border-slate-200 rounded-lg px-3 py-2 text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-slate-300 focus:border-slate-400 transition";

  const labelClass = "block text-sm font-medium text-slate-700 mb-1.5";

  // ── États chargement / erreur fatale ──────────────────
  if (loading) {
    return (
      <main className="min-h-screen bg-slate-100 p-6 flex items-center justify-center">
        <p className="text-slate-500 text-sm">Chargement…</p>
      </main>
    );
  }

  if (error && !form.temperature && !timestamp) {
    return (
      <main className="min-h-screen bg-slate-100 p-6 flex items-center justify-center">
        <div className="text-center">
          <p className="text-red-600 text-sm mb-3">{error}</p>
          <button
            onClick={() => router.push("/")}
            className="text-sm text-slate-500 hover:text-slate-700 transition cursor-pointer"
          >
            ← Retour
          </button>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-slate-100 p-6">
      <div className="max-w-lg mx-auto">

        {/* Header */}
        <div className="mb-6">
          <button
            onClick={() => router.push("/")}
            className="text-sm text-slate-500 hover:text-slate-700 transition mb-3 flex items-center gap-1 cursor-pointer"
          >
            ← Retour
          </button>
          <h1 className="text-3xl font-bold text-slate-900">
            ✏️ Modifier le relevé
          </h1>
          {timestamp && (
            <p className="text-slate-500 mt-1 text-sm">
              {new Date(timestamp).toLocaleString("fr-FR", {
                day: "2-digit", month: "long", year: "numeric",
                hour: "2-digit", minute: "2-digit",
              })}
            </p>
          )}
        </div>

        <div className="bg-white rounded-xl border border-slate-200 p-6">
          <form onSubmit={handleUpdate} className="space-y-5">

            {/* Type */}
            <div>
              <label className={labelClass}>Type de relevé</label>
              <div className="grid grid-cols-2 gap-2">
                {TYPES_RELEVE.map((t) => (
                  <button
                    key={t.value}
                    type="button"
                    onClick={() => setType(t.value)}
                    className={`px-3 py-2 rounded-lg border text-sm font-medium transition cursor-pointer ${
                      type === t.value
                        ? t.value === "mesure"
                          ? "bg-emerald-100 text-emerald-800 border-emerald-200"
                          : "bg-violet-100 text-violet-800 border-violet-200"
                        : "bg-white border-slate-200 text-slate-600 hover:border-slate-300 hover:bg-slate-50"
                    }`}
                  >
                    {t.label}
                  </button>
                ))}
              </div>
            </div>

            <div className="border-t border-slate-100" />

            {/* Température */}
            <div>
              <label className={labelClass}>
                Température (°C) <span className="text-red-500">*</span>
              </label>
              <input
                type="number"
                step="0.1"
                placeholder="ex : 18.4"
                className={inputClass}
                value={form.temperature}
                onChange={field("temperature")}
                required
              />
            </div>

            {/* Précipitations */}
            <div>
              <label className={labelClass}>Précipitations (mm)</label>
              <input
                type="number"
                step="0.1"
                min="0"
                placeholder="ex : 2.1"
                className={inputClass}
                value={form.precipitation}
                onChange={field("precipitation")}
              />
            </div>

            {/* Vent */}
            <div>
              <label className={labelClass}>Vent</label>
              <div className="grid grid-cols-3 gap-2">
                <input
                  type="number"
                  min="0"
                  placeholder="Vitesse km/h"
                  className={inputClass}
                  value={form.vent_vitesse}
                  onChange={field("vent_vitesse")}
                />
                <select
                  className={inputClass}
                  value={form.vent_direction}
                  onChange={field("vent_direction")}
                >
                  <option value="">Direction</option>
                  {DIRECTIONS.map((d) => (
                    <option key={d} value={d}>{d}</option>
                  ))}
                </select>
                <input
                  type="number"
                  min="0"
                  placeholder="Rafales km/h"
                  className={inputClass}
                  value={form.vent_rafales}
                  onChange={field("vent_rafales")}
                />
              </div>
            </div>

            {/* Humidité + Pression */}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className={labelClass}>Humidité (%)</label>
                <input
                  type="number"
                  min="0"
                  max="100"
                  placeholder="ex : 72"
                  className={inputClass}
                  value={form.humidite}
                  onChange={field("humidite")}
                />
              </div>
              <div>
                <label className={labelClass}>Pression (hPa)</label>
                <input
                  type="number"
                  step="0.1"
                  placeholder="ex : 1012.5"
                  className={inputClass}
                  value={form.pression}
                  onChange={field("pression")}
                />
              </div>
            </div>

            {/* Champs spécifiques */}
            <div className="border-t border-slate-100 pt-1">
              <p className="text-xs font-medium text-slate-400 uppercase tracking-wide mb-4">
                Champs spécifiques (optionnels)
              </p>
              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className={labelClass}>Indice UV</label>
                  <input
                    type="number"
                    min="0"
                    max="12"
                    placeholder="0–12"
                    className={inputClass}
                    value={form.indice_uv}
                    onChange={field("indice_uv")}
                  />
                </div>
                <div>
                  <label className={labelClass}>Enneigement (cm)</label>
                  <input
                    type="number"
                    min="0"
                    placeholder="ex : 80"
                    className={inputClass}
                    value={form.enneigement}
                    onChange={field("enneigement")}
                  />
                </div>
                <div>
                  <label className={labelClass}>Vagues (m)</label>
                  <input
                    type="number"
                    step="0.1"
                    min="0"
                    placeholder="ex : 1.5"
                    className={inputClass}
                    value={form.hauteur_vagues}
                    onChange={field("hauteur_vagues")}
                  />
                </div>
              </div>
            </div>

            {/* Erreur */}
            {error && (
              <div className="bg-red-50 border border-red-200 text-red-700 text-sm px-4 py-3 rounded-lg">
                {error}
              </div>
            )}

            {/* Actions */}
            <div className="flex gap-3 pt-1">
              <button
                type="button"
                onClick={() => router.push("/")}
                className="flex-1 bg-slate-100 hover:bg-slate-200 text-slate-700 text-sm font-medium px-4 py-2.5 rounded-lg transition cursor-pointer"
              >
                Annuler
              </button>
              <button
                type="submit"
                disabled={saving}
                className="flex-1 bg-slate-800 hover:bg-slate-700 disabled:bg-slate-400 text-white text-sm font-medium px-4 py-2.5 rounded-lg transition cursor-pointer"
              >
                {saving ? "Enregistrement…" : "Enregistrer"}
              </button>
            </div>

          </form>
        </div>

      </div>
    </main>
  );
}