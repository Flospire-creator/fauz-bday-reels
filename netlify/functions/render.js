// POST /.netlify/functions/render
// Body: { source: <Creatomate source JSON>, meta: {...} }
// Returns: { id: <render id> }
//
// Hides CREATOMATE_API_KEY from the browser. Set it in Netlify site settings.

exports.handler = async (event) => {
  if (event.httpMethod !== "POST") {
    return { statusCode: 405, body: "Method not allowed" };
  }
  const apiKey = process.env.CREATOMATE_API_KEY;
  if (!apiKey) {
    return { statusCode: 500, body: "CREATOMATE_API_KEY not set on server" };
  }

  let payload;
  try {
    payload = JSON.parse(event.body || "{}");
  } catch (e) {
    return { statusCode: 400, body: "Invalid JSON" };
  }
  if (!payload.source) {
    return { statusCode: 400, body: "Missing source" };
  }

  try {
    const res = await fetch("https://api.creatomate.com/v1/renders", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        output_format: "mp4",
        source: payload.source,
        metadata: JSON.stringify(payload.meta || {}),
      }),
    });

    const text = await res.text();
    if (!res.ok) {
      return { statusCode: res.status, body: text };
    }
    const data = JSON.parse(text);
    const first = Array.isArray(data) ? data[0] : data;
    return {
      statusCode: 200,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id: first.id, status: first.status }),
    };
  } catch (e) {
    return { statusCode: 500, body: `Render error: ${e.message}` };
  }
};
