
export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({
      success: false,
      message: "Method not allowed"
    });
  }

  // Validate the scanner PIN configured in Vercel.
  const configuredPin = process.env.SCANNER_PIN;
  const suppliedPin = String(req.body?.pin || "");

  if (
    !configuredPin ||
    suppliedPin !== configuredPin
  ) {
    return res.status(401).json({
      success: false,
      message: "Invalid scanner PIN"
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
      console.error(
        "Apps Script returned a non-JSON response:",
        text.slice(0, 300)
      );

      return res.status(502).json({
        success: false,
        message:
          "Apps Script did not return JSON. Check deployment permissions."
      });
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
