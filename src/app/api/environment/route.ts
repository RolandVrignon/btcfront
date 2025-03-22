export async function GET() {
  return Response.json({
    NEXT_PUBLIC_CTIA_API_URL: process.env.NEXT_PUBLIC_CTIA_API_URL,
    NEXT_PUBLIC_CTIA_API_KEY: process.env.NEXT_PUBLIC_CTIA_API_KEY,
  });
}
