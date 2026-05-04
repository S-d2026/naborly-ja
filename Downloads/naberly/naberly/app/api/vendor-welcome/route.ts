import { NextResponse } from 'next/server';

export async function POST(req: Request) {
  const { vendor } = await req.json();
  if (!vendor?.whatsapp) {
    return NextResponse.json({ error: 'No WhatsApp number' }, { status: 400 });
  }
  // WhatsApp auto-response is handled client-side via wa.me link on success screen.
  // To send server-side messages in future, add Twilio or Meta WhatsApp API here.
  console.log(`New vendor signed up: ${vendor.name} — ${vendor.parish} — ${vendor.whatsapp}`);
  return NextResponse.json({ received: true });
}
