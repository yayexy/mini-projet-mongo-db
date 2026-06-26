import clientPromise from '@/lib/mongodb';
import { NextResponse } from 'next/server';
import { ObjectId } from 'mongodb';

// POST /api/stations/:id/sync
// Récupère la météo actuelle depuis Open-Meteo et insère un relevé
export async function POST(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    const client = await clientPromise;
    const db     = client.db('meteo');

    // ── 1. Récupère la station ────────────────────────
    const station = await db.collection('stations').findOne({
      _id: new ObjectId(id),
    });

    if (!station) {
      return NextResponse.json(
        { error: 'Station introuvable' },
        { status: 404 }
      );
    }

    const coords = station.localisation?.coordinates; // [lng, lat]
    if (!coords || coords.length < 2) {
      return NextResponse.json(
        { error: 'Cette station ne possède pas de coordonnées GPS. Modifie-la pour en ajouter.' },
        { status: 400 }
      );
    }

    const [lng, lat] = coords;

    // ── 2. Appel Open-Meteo ───────────────────────────
    // Docs : https://open-meteo.com/en/docs
    const params_meteo = new URLSearchParams({
      latitude:               String(lat),
      longitude:              String(lng),
      current:                [
        'temperature_2m',
        'precipitation',
        'windspeed_10m',
        'winddirection_10m',
        'windgusts_10m',
        'relative_humidity_2m',
        'surface_pressure',
        'uv_index',
        'snowfall',
      ].join(','),
      wind_speed_unit:        'kmh',
      timezone:               'Europe/Paris',
    });

    const omRes = await fetch(
      `https://api.open-meteo.com/v1/forecast?${params_meteo}`
    );

    if (!omRes.ok) {
      throw new Error(`Open-Meteo a répondu avec le statut ${omRes.status}`);
    }

    const omData = await omRes.json();
    const cur    = omData.current;

    if (!cur) {
      throw new Error('Réponse Open-Meteo invalide (champ "current" absent)');
    }

    // ── 3. Construit l'objet meteo ────────────────────
    const meteo: Record<string, unknown> = {
      temperature: { valeur: cur.temperature_2m, unite: '°C' },
    };

    if (cur.precipitation !== null && cur.precipitation !== undefined)
      meteo.precipitation = { valeur: cur.precipitation, unite: 'mm' };

    if (cur.windspeed_10m !== null && cur.windspeed_10m !== undefined) {
      meteo.vent = {
        vitesse:   cur.windspeed_10m,
        direction: degToCompass(cur.winddirection_10m),
        ...(cur.windgusts_10m != null && { rafales: cur.windgusts_10m }),
      };
    }

    if (cur.relative_humidity_2m != null)
      meteo.humidite = cur.relative_humidity_2m;

    if (cur.surface_pressure != null)
      meteo.pression = cur.surface_pressure;

    if (cur.uv_index != null)
      meteo.indice_uv = cur.uv_index;

    // Enneigement uniquement si > 0 (pertinent pour stations montagne)
    if (cur.snowfall != null && cur.snowfall > 0)
      meteo.enneigement = { valeur: cur.snowfall, unite: 'cm' };

    // ── 4. Insère le relevé ───────────────────────────
    const releve = {
      station_id: new ObjectId(id),
      timestamp:  new Date(cur.time ?? new Date()),
      type:       'mesure',
      source:     'OpenMeteo',
      meteo,
    };

    const result = await db.collection('releves').insertOne(releve);

    return NextResponse.json(
      {
        message: 'Relevé synchronisé avec succès',
        releve_id: result.insertedId.toString(),
        timestamp: releve.timestamp,
        meteo,
      },
      { status: 201 }
    );
  } catch (error) {
    return NextResponse.json(
      { error: (error as Error).message },
      { status: 500 }
    );
  }
}

// Convertit les degrés météo en point cardinal
function degToCompass(deg: number | null | undefined): string | undefined {
  if (deg == null) return undefined;
  const dirs = ['N', 'NE', 'E', 'SE', 'S', 'SW', 'W', 'NW'];
  return dirs[Math.round(deg / 45) % 8];
}