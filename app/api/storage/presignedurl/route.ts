import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { fileName, fileType, projectId } = body;
    console.log('fileName:', fileName)
    console.log('fileType:', fileType)
    console.log('projectId:', projectId)
    console.log('body:', body)

    if (!fileName || !fileType) {
      return NextResponse.json(
        { error: 'Le nom et le type du fichier sont requis' },
        { status: 400 }
      );
    }

    // Récupérer l'URL de l'API depuis les variables d'environnement
    const apiUrl = process.env.NEXT_PUBLIC_CTIA_API_URL;
    console.log('apiUrl:', apiUrl)

    if (!apiUrl) {
      return NextResponse.json(
        { error: 'Configuration API manquante' },
        { status: 500 }
      );
    }

    // Faire la requête à l'API externe
    const response = await fetch(`${apiUrl}/storage/presigned-url`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-API-Key': process.env.NEXT_PUBLIC_CTIA_API_KEY || '',
      },
      body: JSON.stringify({
        fileName: fileName,
        contentType: fileType,
        projectId: projectId || null,
      }),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      return NextResponse.json(
        { error: 'Erreur lors de la récupération de l\'URL présignée', details: errorData },
        { status: response.status }
      );
    }

    const data = await response.json();
    console.log('Presigned URL response:', data);

    return NextResponse.json(data);
  } catch (error) {
    console.error('Erreur lors de la génération de l\'URL présignée:', error);
    return NextResponse.json(
      { error: 'Erreur serveur lors de la génération de l\'URL présignée' },
      { status: 500 }
    );
  }
}