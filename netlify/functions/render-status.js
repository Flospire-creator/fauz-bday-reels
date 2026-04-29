// GET /.netlify/functions/render-status?id=<renderId>
// Returns: { status, url?, error_message? }

exports.handler = async (event) => {
  const apiKey = process.env.CREATOMATE_API_KEY;
  if (!apiKey) {
    return { statusCode: 500, body: "CREATOMATE_API_KEY not set on server" };
  }
  const id = (event.queryStringParameters || {}).id;
  if (!id) {
    return { statusCode: 400, body: "Missing id" };
  }

  try {
    const res = await fetch(`https://api.creatomate.com/v1/renders/${encodeURIComponent(id)}`, {
      headers: { Authorization: `Bearer ${apiKey}` },
    });
    const text = await res.text();
    if (!res.ok) {
      return { statusCode: res.status, body: text };
    }
    const data = JSON.parse(text);
    return {
      statusCode: 200,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        status: data.status,
        url: data.url,
        error_message: data.error_message,
      }),
    };
  } catch (e) {
    return { statusCode: 500, body: `Status error: ${e.message}` };
  }
};
