"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export default function NewReleve() {
  const router = useRouter();

  const [form, setForm] = useState({
    station_id: "",
    temperature: "",
    precipitation: "",
    vent: "",
  });

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();

    await fetch("/api/releves", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        station_id: form.station_id,
        timestamp: new Date(),
        meteo: {
          temperature: {
            valeur: Number(form.temperature),
          },
          precipitation: {
            valeur: Number(form.precipitation),
          },
          vent: {
            vitesse: Number(form.vent),
          },
        },
      }),
    });

    router.push("/");
  }

  return (
    <div className="p-8 max-w-xl mx-auto">
      <h1 className="text-2xl font-bold mb-4">
        Nouveau relevé
      </h1>

      <form onSubmit={handleSubmit} className="space-y-4">
        <input
          placeholder="Station ID"
          className="w-full border p-2"
          value={form.station_id}
          onChange={(e) =>
            setForm({
              ...form,
              station_id: e.target.value,
            })
          }
        />

        <input
          placeholder="Température"
          className="w-full border p-2"
          onChange={(e) =>
            setForm({
              ...form,
              temperature: e.target.value,
            })
          }
        />

        <input
          placeholder="Précipitation"
          className="w-full border p-2"
          onChange={(e) =>
            setForm({
              ...form,
              precipitation: e.target.value,
            })
          }
        />

        <input
          placeholder="Vent"
          className="w-full border p-2"
          onChange={(e) =>
            setForm({ ...form, vent: e.target.value })
          }
        />

        <button className="bg-black text-white px-4 py-2">
          Ajouter
        </button>
      </form>
    </div>
  );
}