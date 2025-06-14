import { useState, useEffect } from 'react';
import { useProfileImage } from './useProfileImage';

interface UserData {
  id: number;
  firstName: string;
  lastName: string | null;
  profilePictureId?: string;
}

export function useUserData(userId: number | undefined, token: string | null) {
  const [userData, setUserData] = useState<UserData | null>(null);
  
  const profileImage = useProfileImage(
    userData?.profilePictureId 
      ? `http://`+ipAddress+`:5263/api/Attachment/${userData.profilePictureId}`
      : undefined,
    token || ''
  );

  useEffect(() => {
    if (!userId || !token) return;

    const fetchUser = async () => {
      try {
        const res = await fetch(`http://`+ipAddress+`:5263/api/User/${userId}`, {
          headers: { 
            Accept: "application/json",
            Authorization: `Bearer ${token}` 
          }
        });
        const data = await res.json();
        setUserData(data);
      } catch (err) {
        console.error('Error fetching user:', err);
      }
    };

    fetchUser();
  }, [userId, token]);

  return {
    userData,
    profileImage,
    avatarUrl: profileImage || `https://ui-avatars.com/api/?name=${encodeURIComponent(userData?.firstName || 'User')}`
  };
}
