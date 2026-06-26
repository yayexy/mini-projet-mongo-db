import clientPromise from '@/lib/mongodb';
import { NextResponse } from 'next/server';
import { ObjectId } from 'mongodb';

// GET /api/releves
// Params supportés :
//   station_id  — ObjectId en string
//   type        — "mesure" | "prevision"
//   from        — ISO date (timestamp >=)
//   to          — ISO date (timestamp <=)
//   temp_min    — nombre (°C)
//   temp_max    — nombre (°C)
//   precip_min  — nombre (mm)
//   vent_min    — nombre (km/h)
//   sort        — "asc" | "desc" (défaut : desc)
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);

    const stationId = searchParams.get('station_id');
    const type      = searchParams.get('type');
    const from      = searchParams.get('from');
    const to        = searchParams.get('to');
    const tempMin   = searchParams.get('temp_min');
    const tempMax   = searchParams.get('temp_max');
    const precipMin = searchParams.get('precip_min');
    const ventMin   = searchParams.get('vent_min');
    const sort      = searchParams.get('sort') === 'asc' ? 1 : -1;

    // ── Construction du filtre MongoDB ────────────────
    const filter: Record<string, unknown> = {};

    if (stationId) {
      filter.station_id = new ObjectId(stationId);
    }

    if (type) {
      filter.type = type;
    }

    // Plage temporelle
    if (from || to) {
      const tsFilter: Record<string, Date> = {};
      if (from) tsFilter.$gte = new Date(from);
      if (to)   tsFilter.$lte = new Date(to);
      filter.timestamp = tsFilter;
    }

    // Plage de température (champ imbriqué)
    if (tempMin !== null || tempMax !== null) {
      const tempFilter: Record<string, number> = {};
      if (tempMin !== null) tempFilter.$gte = Number(tempMin);
      if (tempMax !== null) tempFilter.$lte = Number(tempMax);
      filter['meteo.temperature.valeur'] = tempFilter;
    }

    // Précipitations minimum
    if (precipMin !== null) {
      filter['meteo.precipitation.valeur'] = { $gte: Number(precipMin) };
    }

    // Vent minimum
    if (ventMin !== null) {
      filter['meteo.vent.vitesse'] = { $gte: Number(ventMin) };
    }

    // ── Requête ───────────────────────────────────────
    const client = await clientPromise;
    const db     = client.db('meteo');

    const releves = await db
      .collection('releves')
      .find(filter)
      .sort({ timestamp: sort })
      .toArray();

    // ── Sérialisation des ObjectId ────────────────────
    const serialized = releves.map((r) => ({
      ...r,
      _id:        r._id.toString(),
      station_id: r.station_id?.toString?.() ?? r.station_id,
    }));

    return NextResponse.json(serialized);
  } catch (error) {
    return NextResponse.json(
      { error: (error as Error).message },
      { status: 500 }
    );
  }
}

// POST /api/releves → Ajoute un relevé
export async function POST(request: Request) {
  try {
    const body = await request.json();

    if (body.station_id) {
      body.station_id = new ObjectId(body.station_id);
    }

    const client = await clientPromise;
    const db     = client.db('meteo');
    const result = await db.collection('releves').insertOne(body);

    return NextResponse.json(
      {
        ...body,
        _id:        result.insertedId.toString(),
        station_id: body.station_id?.toString?.() ?? body.station_id,
      },
      { status: 201 }
    );
  } catch (error) {
    return NextResponse.json(
      { error: (error as Error).message },
      { status: 400 }
    );
  }
}