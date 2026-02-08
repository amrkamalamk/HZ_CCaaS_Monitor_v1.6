
import { NextResponse } from 'next/server';
import { getGenesysToken } from '../_lib/genesysAuth';

export async function GET() {
  try {
    const { token, region } = await getGenesysToken();
    const response = await fetch(`https://api.${region}/api/v2/users/me`, {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Accept': 'application/json'
      }
    });

    if (!response.ok) {
      return NextResponse.json({ error: 'Failed to fetch user' }, { status: response.status });
    }

    const data = await response.json();
    return NextResponse.json(data);
  } catch (error: any) {
    return NextResponse.json(
      { error: 'Internal User Bridge Failure', details: error.message },
      { status: 500 }
    );
  }
}
