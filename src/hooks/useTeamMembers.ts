import { useState, useEffect } from 'react';
import { getTeamMembers } from '../services/teamMemberListApiForLive';
;

export const useTeamMembers = (isOnline: boolean) => {
  const [members, setMembers] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (isOnline) {
      fetchTeamMembers();
    }
  }, [isOnline]);

  const fetchTeamMembers = async () => {
    setIsLoading(true);
    setError(null);
    
    try {
      // Ei function-ti ekhon mock data return korbe (jehetu isMock = true)
      const data = await getTeamMembers();
      setMembers(data);
    } catch (err: any) {
      console.error('Error in useTeamMembers hook:', err);
      setError(err.message || 'Something went wrong');
    } finally {
      setIsLoading(false);
    }
  };

  return { members, isLoading, error, fetchTeamMembers };
};