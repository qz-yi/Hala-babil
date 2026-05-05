import { Router } from "express";

const router = Router();

router.post("/moderate", async (req, res) => {
  const { imageBase64 } = req.body as { imageBase64?: string };

  if (!imageBase64) {
    return res.json({ safe: true });
  }

  const baseUrl = process.env["AI_INTEGRATIONS_OPENAI_BASE_URL"];
  const apiKey = process.env["AI_INTEGRATIONS_OPENAI_API_KEY"];

  if (!baseUrl || !apiKey) {
    return res.json({ safe: true });
  }

  try {
    const response = await fetch(`${baseUrl}/chat/completions`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: "gpt-5-mini",
        max_completion_tokens: 100,
        messages: [
          {
            role: "user",
            content: [
              {
                type: "text",
                text: 'You are a strict content moderator. Analyze this image and determine if it contains any inappropriate content: nudity, sexual content, graphic violence, gore, or illegal material. Reply ONLY with a valid JSON object — no markdown, no extra text. If safe: {"safe":true}. If not safe: {"safe":false,"reason":"brief reason in English"}.',
              },
              {
                type: "image_url",
                image_url: {
                  url: `data:image/jpeg;base64,${imageBase64}`,
                  detail: "low",
                },
              },
            ],
          },
        ],
      }),
    });

    if (!response.ok) {
      return res.json({ safe: true });
    }

    const data = (await response.json()) as any;
    const content: string =
      data?.choices?.[0]?.message?.content ?? '{"safe":true}';

    const cleaned = content.replace(/```json|```/g, "").trim();
    const result = JSON.parse(cleaned);
    return res.json({ safe: !!result.safe, reason: result.reason });
  } catch {
    return res.json({ safe: true });
  }
});

export default router;
