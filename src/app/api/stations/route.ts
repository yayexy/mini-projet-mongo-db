import clientPromise from '@/lib/mongodb';
import { NextResponse } from 'next/server';

// GET /api/stations → Liste toutes les stations
export async function GET() {
  try {
    const client = await clientPromise;
    const db = client.db('meteo');
    const stations = await db.collection('stations').find({}).toArray();
    return NextResponse.json(stations);
  } catch (error) {
    return NextResponse.json(
      { error: (error as Error).message },
      { status: 500 }
    );
  }
}

// POST /api/stations → Crée une nouvelle station
export async function POST(request: Request) {
  try {
    const body = await request.json();
    const client = await clientPromise;
    const db = client.db('meteo');
    const result = await db.collection('stations').insertOne(body);
    return NextResponse.json(
      { ...body, _id: result.insertedId },
      { status: 201 }
    );
  } catch (error) {
    return NextResponse.json(
      { error: (error as Error).message },
      { status: 400 }
    );
  }
}