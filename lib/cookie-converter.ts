/**
 * Converts cookies from JSON format (browser extension export) to Netscape/Mozilla format for yt-dlp
 */
export function convertJsonCookiesToNetscape(jsonCookies: string): string {
  try {
    // Parse the JSON cookies
    const cookies = JSON.parse(jsonCookies)

    // Start with the Netscape cookies file header
    let netscapeCookies = "# Netscape HTTP Cookie File\n"

    // Convert each cookie to Netscape format
    for (const cookie of cookies) {
      // Skip cookies without required fields
      if (!cookie.domain || !cookie.name || cookie.value === undefined) {
        continue
      }

      // Format: domain, flag, path, secure, expiration, name, value
      const domain = cookie.domain.startsWith(".") ? cookie.domain : `.${cookie.domain}`
      const flag = cookie.hostOnly ? "FALSE" : "TRUE"
      const path = cookie.path || "/"
      const secure = cookie.secure ? "TRUE" : "FALSE"

      // Convert expiration date (in seconds)
      let expiration = "0"
      if (cookie.expirationDate) {
        expiration = Math.floor(cookie.expirationDate).toString()
      } else if (cookie.session === false) {
        // If it's not a session cookie but no expiration, set a far future date
        expiration = Math.floor(Date.now() / 1000 + 31536000).toString() // 1 year
      }

      // Combine all fields with tabs
      const cookieLine = [domain, flag, path, secure, expiration, cookie.name, cookie.value].join("\t")

      netscapeCookies += cookieLine + "\n"
    }

    return netscapeCookies
  } catch (error) {
    console.error("Error converting cookies:", error)
    return "# Netscape HTTP Cookie File\n"
  }
}
