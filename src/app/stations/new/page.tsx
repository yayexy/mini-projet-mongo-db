"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

const TYPES = [
  { value: "urbaine",         label: "Urbaine" },
  { value: "montagne",        label: "Montagne" },
  { value: "côtière",         label: "Côtière" },
  { value: "méditerranéenne", label: "Méditerranéenne" },
];

const TYPE_BADGES: Record<string, string> = {
  urbaine:          "bg-sky-100 text-sky-800 border-sky-200",
  montagne:         "bg-indigo-100 text-indigo-800 border-indigo-200",
  "côtière":        "bg-cyan-100 text-cyan-800 border-cyan-200",
  méditerranéenne:  "bg-orange-100 text-orange-800 border-orange-200",
};

export default function NewStation() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError]     = useState<string | null>(null);

  const [form, setForm] = useState({
    nom:      "",
    region:   "",
    pays:     "France",
    altitude: "",
    type:     "urbaine",
    lat:      "",
    lng:      "",
  });

  function field(key: keyof typeof form) {
    return (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) =>
      setForm({ ...form, [key]: e.target.value });
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    if (!form.nom.trim()) {
      setError("Le nom de la station est obligatoire.");
      return;
    }

    // Validation coords : les deux ou aucun
    const hasLat = form.lat !== "";
    const hasLng = form.lng !== "";
    if (hasLat !== hasLng) {
      setError("Renseigne la latitude ET la longitude, ou laisse les deux vides.");
      return;
    }

    setLoading(true);
    try {
      const body: Record<string, unknown> = {
        nom:      form.nom.trim(),
        region:   form.region.trim()   || undefined,
        pays:     form.pays.trim()     || undefined,
        altitude: form.altitude !== "" ? Number(form.altitude) : undefined,
        type:     form.type,
        actif:    true,
        date_creation: new Date().toISOString(),
      };

      // Construit l'objet GeoJSON seulement si coords renseignées
      if (hasLat && hasLng) {
        body.localisation = {
          type: "Point",
          coordinates: [Number(form.lng), Number(form.lat)], // GeoJSON : [lng, lat]
        };
      }

      const res = await fetch("/api/stations", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error ?? "Erreur lors de la création");
      }

      router.push("/");
    } catch (err) {
      setError((err as Error).message);
      setLoading(false);
    }
  }

  const inputClass =
    "w-full bg-white border border-slate-200 rounded-lg px-3 py-2 text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-slate-300 focus:border-slate-400 transition";

  const labelClass = "block text-sm font-medium text-slate-700 mb-1.5";

  return (
    <main className="min-h-screen bg-slate-100 p-6">
      <div className="max-w-lg mx-auto">

        <div className="mb-6">
          <button
            onClick={() => router.push("/")}
            className="text-sm text-slate-500 hover:text-slate-700 transition mb-3 flex items-center gap-1 cursor-pointer"
          >
            ← Retour
          </button>
          <h1 className="text-3xl font-bold text-slate-900">🌤 Nouvelle station</h1>
          <p className="text-slate-500 mt-1 text-sm">
            Ajoute une station météorologique à la plateforme
          </p>
        </div>

        <div className="bg-white rounded-xl border border-slate-200 p-6">
          <form onSubmit={handleSubmit} className="space-y-5">

            {/* Nom */}
            <div>
              <label className={labelClass}>
                Nom de la station <span className="text-red-500">*</span>
              </label>
              <input
                placeholder="ex : Paris - Montsouris"
                className={inputClass}
                value={form.nom}
                onChange={field("nom")}
                required
              />
              <p className="text-xs text-slate-400 mt-1">
                Inclut généralement la ville, ex : &quot;Brest - Guipavas&quot;
              </p>
            </div>

            {/* Région + Pays */}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className={labelClass}>Région</label>
                <input
                  placeholder="ex : Île-de-France"
                  className={inputClass}
                  value={form.region}
                  onChange={field("region")}
                />
              </div>
              <div>
                <label className={labelClass}>Pays</label>
                <input
                  placeholder="France"
                  className={inputClass}
                  value={form.pays}
                  onChange={field("pays")}
                />
              </div>
            </div>

            {/* Altitude */}
            <div>
              <label className={labelClass}>Altitude (m)</label>
              <input
                type="number"
                placeholder="ex : 75"
                className={inputClass}
                value={form.altitude}
                onChange={field("altitude")}
                min={-500}
                max={9000}
              />
            </div>

            {/* Coordonnées GPS */}
            <div>
              <label className={labelClass}>
                Coordonnées GPS
                <span className="ml-1.5 text-xs font-normal text-slate-400">
                  (nécessaires pour la synchronisation météo)
                </span>
              </label>
              <div className="grid grid-cols-2 gap-3">
                <input
                  type="number"
                  step="0.0001"
                  placeholder="Latitude  ex : 48.8224"
                  className={inputClass}
                  value={form.lat}
                  onChange={field("lat")}
                  min={-90}
                  max={90}
                />
                <input
                  type="number"
                  step="0.0001"
                  placeholder="Longitude  ex : 2.3378"
                  className={inputClass}
                  value={form.lng}
                  onChange={field("lng")}
                  min={-180}
                  max={180}
                />
              </div>
              <p className="text-xs text-slate-400 mt-1">
                Trouvable sur Google Maps en faisant clic droit → &quot;C&apos;est ici&quot;
              </p>
            </div>

            {/* Type */}
            <div>
              <label className={labelClass}>Type de station</label>
              <div className="grid grid-cols-2 gap-2">
                {TYPES.map((t) => (
                  <button
                    key={t.value}
                    type="button"
                    onClick={() => setForm({ ...form, type: t.value })}
                    className={`px-3 py-2 rounded-lg border text-sm font-medium transition cursor-pointer ${
                      form.type === t.value
                        ? TYPE_BADGES[t.value]
                        : "bg-white border-slate-200 text-slate-600 hover:border-slate-300 hover:bg-slate-50"
                    }`}
                  >
                    {t.label}
                  </button>
                ))}
              </div>
            </div>

            {error && (
              <div className="bg-red-50 border border-red-200 text-red-700 text-sm px-4 py-3 rounded-lg">
                {error}
              </div>
            )}

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
                disabled={loading}
                className="flex-1 bg-slate-800 hover:bg-slate-700 disabled:bg-slate-400 text-white text-sm font-medium px-4 py-2.5 rounded-lg transition cursor-pointer"
              >
                {loading ? "Création…" : "Créer la station"}
              </button>
            </div>

          </form>
        </div>
      </div>
    </main>
  );
}