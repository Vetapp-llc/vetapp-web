/** Decode a JWT payload without verification (backend already verified it). */
export function jwtDecode(token: string): Record<string, string> {
  try {
    const parts = token.split(".");
    if (parts.length !== 3) return {};
    const payload = Buffer.from(parts[1], "base64url").toString("utf-8");
    return JSON.parse(payload);
  } catch {
    return {};
  }
}
