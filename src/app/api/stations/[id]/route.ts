import clientPromise from '@/lib/mongodb';
import { NextResponse } from 'next/server';
import { ObjectId } from 'mongodb';

// GET /api/stations/:id → Détails d'une station
export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    const client = await clientPromise;
    const db = client.db('meteo');
    const station = await db.collection('stations').findOne({
      _id: new ObjectId(id)
    });
    if (!station) {
      return NextResponse.json(
        { error: "Station non trouvée" },
        { status: 404 }
      );
    }
    return NextResponse.json(station);
  } catch (error) {
    return NextResponse.json(
      { error: (error as Error).message },
      { status: 500 }
    );
  }
}

// PUT /api/stations/:id → Met à jour une station
export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    const body = await request.json();
    const client = await clientPromise;
    const db = client.db('meteo');
    const result = await db.collection('stations').updateOne(
      { _id: new ObjectId(id) },
      { $set: body }
    );
    if (result.matchedCount === 0) {
      return NextResponse.json(
        { error: "Station non trouvée" },
        { status: 404 }
      );
    }
    return NextResponse.json({ ...body, _id: id });
  } catch (error) {
    return NextResponse.json(
      { error: (error as Error).message },
      { status: 400 }
    );
  }
}

// DELETE /api/stations/:id → Supprime une station
export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    
    const client = await clientPromise;
    const db = client.db('meteo');
    const result = await db.collection('stations').deleteOne({
      _id: new ObjectId(id)
    });
    if (result.deletedCount === 0) {
      return NextResponse.json(
        { error: "Station non trouvée" },
        { status: 404 }
      );
    }
    return NextResponse.json(
      { message: "Station supprimée avec succès" },
      { status: 200 }
    );
  } catch (error) {
    return NextResponse.json(
      { error: (error as Error).message },
      { status: 500 }
    );
  }
}