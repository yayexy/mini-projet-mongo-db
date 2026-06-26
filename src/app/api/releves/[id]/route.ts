import clientPromise from '@/lib/mongodb';
import { NextResponse } from 'next/server';
import { ObjectId } from 'mongodb';

// GET /api/releves/:id
export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    const client = await clientPromise;
    const db = client.db('meteo');
    const releve = await db.collection('releves').findOne({
      _id: new ObjectId(id)
    });
    if (!releve) {
      return NextResponse.json(
        { error: "Relevé non trouvé" },
        { status: 404 }
      );
    }
    return NextResponse.json(releve);
  } catch (error) {
    return NextResponse.json(
      { error: (error as Error).message },
      { status: 500 }
    );
  }
}

// PUT /api/releves/:id
export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    const body = await request.json();
    if (body.station_id) {
      body.station_id = new ObjectId(body.station_id);
    }
    const client = await clientPromise;
    const db = client.db('meteo');
    const result = await db.collection('releves').updateOne(
      { _id: new ObjectId(id) },
      { $set: body }
    );
    if (result.matchedCount === 0) {
      return NextResponse.json(
        { error: "Relevé non trouvé" },
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

// DELETE /api/releves/:id
export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    const client = await clientPromise;
    const db = client.db('meteo');
    const result = await db.collection('releves').deleteOne({
      _id: new ObjectId(id)
    });
    if (result.deletedCount === 0) {
      return NextResponse.json(
        { error: "Relevé non trouvé" },
        { status: 404 }
      );
    }
    return NextResponse.json(
      { message: "Relevé supprimé avec succès" },
      { status: 200 }
    );
  } catch (error) {
    return NextResponse.json(
      { error: (error as Error).message },
      { status: 500 }
    );
  }
}