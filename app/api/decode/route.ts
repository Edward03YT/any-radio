import { NextRequest, NextResponse } from 'next/server';
import { getDecoder, DecodeResult } from '@/lib/decoders';
import { validateDecodeRequest, DecodeApiRequest } from '@/lib/validation';
import { checkRateLimit } from '@/lib/rateLimit';

export async function POST(req: NextRequest) {
  // 1. Resolve client IP for rate limiting
  const forwarded = req.headers.get('x-forwarded-for');
  const ip = forwarded ? forwarded.split(',')[0].trim() : '127.0.0.1';

  const rateCheck = checkRateLimit(ip);
  const rateHeaders = {
    'X-RateLimit-Limit': rateCheck.limit.toString(),
    'X-RateLimit-Remaining': rateCheck.remaining.toString(),
    'X-RateLimit-Reset': rateCheck.resetInSeconds.toString(),
  };

  if (!rateCheck.allowed) {
    return NextResponse.json(
      {
        ok: false,
        error: `Ai depasit limita de cereri. Te rugam sa astepti ${rateCheck.resetInSeconds} secunde inainte de a reincerca.`,
      },
      {
        status: 429,
        headers: rateHeaders,
      }
    );
  }

  // 2. Parse JSON body safely
  let payload: unknown;
  try {
    payload = await req.json();
  } catch {
    return NextResponse.json(
      { ok: false, error: 'Format JSON invalid.' },
      { status: 400, headers: rateHeaders }
    );
  }

  // 3. Schema and business validation
  const validation = validateDecodeRequest(payload);
  if (!validation.isValid) {
    return NextResponse.json(
      {
        ok: false,
        error: Object.values(validation.errors)[0] || 'Validare esuata.',
        fieldErrors: validation.errors,
      },
      { status: 400, headers: rateHeaders }
    );
  }

  const { brand, serial } = payload as DecodeApiRequest;
  const decoder = getDecoder(brand)!;

  try {
    const result: DecodeResult = await decoder.decode(serial);

    return NextResponse.json(
      {
        ...result,
        normalizedSerial: validation.normalizedSerial,
      },
      {
        status: result.ok ? 200 : 200, // Return 200 even for informative fallback/lookup statuses so client renders diagnostic view
        headers: rateHeaders,
      }
    );
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Eroare neasteptata la decodare.';
    return NextResponse.json(
      { ok: false, error: message },
      { status: 500, headers: rateHeaders }
    );
  }
}
