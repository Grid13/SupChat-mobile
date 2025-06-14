import { useEffect, useState } from 'react';

/**
 * Hook to fetch a protected profile image as base64 if needed, else returns null.
 * @param imageUrl The image URL (may be protected)
 * @param token The auth token for protected endpoints
 * @returns base64 string or null
 */
export function useProfileImage(imageUrl?: string, token?: string) {
  const [base64, setBase64] = useState<string | null>(null);
  useEffect(() => {
    if (imageUrl && imageUrl.startsWith('http://'+ipAddress+':5263/api/Attachment/')) {
      (async () => {
        try {
          const res = await fetch(imageUrl, { headers: { Authorization: `Bearer ${token}` } });
          if (res.ok) {
            const blob = await res.blob();
            const reader = new FileReader();
            reader.onloadend = () => setBase64(reader.result as string);
            reader.readAsDataURL(blob);
          } else {
            setBase64(null);
          }
        } catch {
          setBase64(null);
        }
      })();
    } else {
      setBase64(null);
    }
  }, [imageUrl, token]);
  return base64;
}
