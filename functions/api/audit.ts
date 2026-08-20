import { runAudit, AuditError } from "../../src/lib/run-audit";

interface PagesFunctionContext {
  request: Request;
}

export const onRequestGet = async ({ request }: PagesFunctionContext): Promise<Response> => {
  const targetUrl = new URL(request.url).searchParams.get("url");
  if (!targetUrl) {
    return jsonResponse({ error: "Missing ?url= query param." }, 400);
  }

  try {
    const report = await runAudit(targetUrl);
    return jsonResponse(report, 200);
  } catch (err) {
    if (err instanceof AuditError) {
      return jsonResponse({ error: err.message }, 400);
    }
    return jsonResponse({ error: "Something went wrong running that audit." }, 500);
  }
};

function jsonResponse(body: unknown, status: number): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { "content-type": "application/json" },
  });
}
