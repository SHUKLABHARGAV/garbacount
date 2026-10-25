
export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({
      success: false,
      message: "Method not allowed"
    });
  }

  const secret = process.env.SCANNER_API_SECRET;

  if (
    !secret ||
    req.headers["x-scanner-secret"] !== secret
  ) {
    return res.status(401).json({
      success: false,
      message: "Unauthorized"
    });
  }

  const scriptUrl = process.env.APPS_SCRIPT_URL;

  if (!scriptUrl) {
    return res.status(500).json({
      success: false,
      message: "Backend URL is not configured"
    });
  }

  try {
    const upstream = await fetch(scriptUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        qrData: String(req.body?.qrData || "")
      }),
      redirect: "follow"
    });

    const text = await upstream.text();

    let data;
    try {
      data = JSON.parse(text);
    } catch {
      throw new Error(
        "Apps Script did not return JSON. Check web app access permissions."
      );
    }

    return res.status(200).json(data);

  } catch (error) {
    console.error("Scan backend error:", error.message);

    return res.status(502).json({
      success: false,
      message: "Could not connect to the employee scan backend."
    });
  }
}
