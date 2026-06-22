// Jokhon live jaben, tokhon shudhu ei URL-ti bodle phelben
const BASE_URL = 'https://localhost:44361/api/OfflineSync';

// Toggle Flag: true thakle mock data cholbe, false korle live API kaj korbe
const isMock = false; 

// Mock Data ekhanei thakbe
const MOCK_TEAM_MEMBERS = [
  'Sarah Johnson',
  'Michael Brown',
  'Emily Davis',
  'James Wilson',
  'Maria Garcia',
  'David Martinez',
  'Jennifer Lee',
  'William Thompson',
];

/**
 * Team members fetch korar main function
 * @returns Promise<string[]>
 */
export const getTeamMembers = async (): Promise<string[]> => {
  // --- MOCK MODE ---
  if (isMock) {
    // Real API-er moto ekti chotto artificial delay (300ms) dewa holo
    await new Promise(resolve => setTimeout(resolve, 300));
    return MOCK_TEAM_MEMBERS;
  }

  // --- LIVE MODE (Jokhon isMock = false hobe) ---
  const response = await fetch(`${BASE_URL}/GetUserList`, {
    method: 'GET',
    headers: {
      'Content-Type': 'application/json',
    },
    credentials: 'include',
  });

  if (!response.ok) {
    throw new Error(`Failed to fetch team members: ${response.statusText}`);
  }

  const result = await response.json();
  const dataList = result.Data || result.data || [];
  
  return dataList.map((user: any, index: number) => {
    if (typeof user === 'string') return user || `Unknown-${index}`;
    
    const fullName = user.FullNameFormatted || user.FullName || 
                    (user.FirstName ? (user.FirstName + ' ' + (user.LastName || '')) : '') || 
                    user.LoginId;
                    
    return fullName ? fullName.trim() : `Unknown User ${index + 1}`;
  });
};