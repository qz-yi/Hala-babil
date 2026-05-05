const API_BASE = process.env.EXPO_PUBLIC_DOMAIN
  ? `https://${process.env.EXPO_PUBLIC_DOMAIN}`
  : "";

export interface ModerationResult {
  safe: boolean;
  reason?: string;
}

async function uriToBase64(uri: string): Promise<string | null> {
  try {
    const response = await fetch(uri);
    const blob = await response.blob();
    return await new Promise<string>((resolve, reject) => {
      const reader = new FileReader();
      reader.onloadend = () => {
        const result = reader.result as string;
        const base64 = result.split(",")[1];
        resolve(base64);
      };
      reader.onerror = reject;
      reader.readAsDataURL(blob);
    });
  } catch {
    return null;
  }
}

export async function moderateContent(uri: string): Promise<ModerationResult> {
  try {
    if (!uri || !API_BASE) return { safe: true };

    const base64 = await uriToBase64(uri);
    if (!base64) return { safe: true };

    const res = await fetch(`${API_BASE}/api/moderate`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ imageBase64: base64 }),
    });

    if (!res.ok) return { safe: true };
    return await res.json();
  } catch {
    return { safe: true };
  }
}
