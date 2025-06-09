import { useState, useEffect } from 'react';
import { useProfileImage } from './useProfileImage';

interface UserData {
  id: number;
  firstName: string;
  lastName: string | null;
  profilePictureId?: string;
}

export function useMessageSender(senderId: number | undefined, token: string | null) {
  const [userData, setUserData] = useState<UserData | null>(null);

  useEffect(() => {
    if (!senderId || !token) return;

    const fetchUser = async () => {
      try {
        const res = await fetch(`http://192.168.1.161:5263/api/User/${senderId}`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        const data = await res.json();
        setUserData(data);
      } catch (err) {
        console.error('Error fetching user:', err);
      }
    };

    fetchUser();
  }, [senderId, token]);

  // Use the profile image hook for protected attachments
  const profileImage = useProfileImage(
    userData?.profilePictureId 
      ? `http://192.168.1.161:5263/api/Attachment/${userData.profilePictureId}`
      : undefined,
    token || ''
  );

  const avatarUrl = profileImage || 
    `https://ui-avatars.com/api/?name=${encodeURIComponent(userData?.firstName || 'User')}`;

  return { avatarUrl, userData };
}
