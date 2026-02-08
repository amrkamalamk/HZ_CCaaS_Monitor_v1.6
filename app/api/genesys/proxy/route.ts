
import { NextRequest, NextResponse } from 'next/server';
import { getGenesysToken } from '../_lib/genesysAuth';

export async function POST(req: NextRequest) {
  return handleRequest(req);
}

export async function GET(req: NextRequest) {
  return handleRequest(req);
}

async function handleRequest(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const path = searchParams.get('path');

  if (!path) {
    return NextResponse.json({ error: 'Missing path parameter' }, { status: 400 });
  }

  try {
    const { token, region } = await getGenesysToken();
    const targetUrl = `https://api.${region}${decodeURIComponent(path)}`;
    
    const method = req.method;
    const body = method === 'POST' ? await req.text() : undefined;

    const response = await fetch(targetUrl, {
      method: method,
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
        'Accept': 'application/json'
      },
      body: body
    });

    const data = await response.json().catch(() => ({}));
    return NextResponse.json(data, { status: response.status });
  } catch (error: any) {
    return NextResponse.json(
      { error: 'Genesys Bridge Failure', details: error.message },
      { status: 500 }
    );
  }
}
