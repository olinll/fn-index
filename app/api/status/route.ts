import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const url = searchParams.get('url');

  if (!url) {
    return NextResponse.json({ error: 'URL is required' }, { status: 400 });
  }

  const start = Date.now();
  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 3000); // 1.5s timeout for faster feedback

    const response = await fetch(url, {
      method: 'HEAD',
      signal: controller.signal,
      cache: 'no-store',
    });
    
    clearTimeout(timeoutId);

    const end = Date.now();
    const latency = end - start;

    if (response.ok || response.status < 500) { // Consider 4xx as online but maybe auth required
       return NextResponse.json({ status: 'online', latency });
    } else {
       return NextResponse.json({ status: 'offline', latency, code: response.status });
    }

  } catch (error) {
    const end = Date.now();
    return NextResponse.json({ status: 'offline', latency: end - start, error: String(error) });
  }
}
