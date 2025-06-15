import { useEffect, useState } from 'react';

const ipAddress = process.env.EXPO_PUBLIC_IP_ADDRESS;

/**
 * Hook to fetch a protected profile image as base64 if needed, else returns null.
 * @param imageUrl The image URL (may be protected)
 * @param token The auth token for protected endpoints
 * @returns base64 string or null
 */
export function useProfileImage(imageUrl?: string, token?: string) {
  const [base64, setBase64] = useState<string | null>(null);

  useEffect(() => {
    if (imageUrl && imageUrl.startsWith('http://' + ipAddress + ':5263/api/Attachment/')) {
      (async () => {
        try {
          const res = await fetch(imageUrl, { headers: { Authorization: `Bearer ${token}` } });
          if (res.ok) {
            const blob = await res.blob();
            const reader = new FileReader();
            reader.onloadend = () => setBase64(reader.result as string);
            reader.readAsDataURL(blob);
          } else {
            console.error(`Failed to fetch image. Status: ${res.status}`);
            setBase64(null);
          }
        } catch (error) {
          console.error('Error fetching image:', error);
          setBase64(null);
        }
      })();
    } else {
      console.warn('Invalid image URL or unsupported format:', imageUrl);
      setBase64(null);
    }
  }, [imageUrl, token]);

  return base64;
}
