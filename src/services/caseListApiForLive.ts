import type { CaseData } from "../types/caseNote";

const BASE_URL = 'https://localhost:44361/api/OfflineSync';

const isMock = false; 

// // Mock Data ekhanei thakbe
// const MOCK_CASES: CaseData[] = [
//   {
//     id: '1',
//     caseName: 'CASE-2024-001',
//     parents: ['John Doe', 'Jane Doe', 'Robert Doe'],
//     children: ['Tommy Doe', 'Sarah Doe', 'Emily Doe'],
//     isGroup: false,
//   },
//   {
//     id: '2',
//     caseName: 'CASE-2024-002',
//     parents: ['Michael Smith', 'Jessica Smith'],
//     children: ['Emma Smith'],
//     isGroup: false,
//   },
//   {
//     id: '3',
//     caseName: 'GROUP-CASE-2024-003',
//     parents: ['Parent A', 'Parent B', 'Parent C'],
//     children: ['Child 1', 'Child 2', 'Child 3', 'Child 4'],
//     isGroup: true,
//   },
//   {
//     id: '4',
//     caseName: 'CASE-2024-004',
//     parents: ['Robert Johnson'],
//     children: ['Alice Johnson', 'Bob Johnson', 'Charlie Johnson'],
//     isGroup: false,
//   },
//   {
//     id: '5',
//     caseName: 'CASE-2024-005',
//     parents: ['David Wilson', 'Sarah Wilson'],
//     children: ['Mike Wilson'],
//     isGroup: false,
//   },
// ];

/**
 * Login ID er upor base kore cases fetch korar function
 * @param loginId string
 * @returns Promise<CaseData[]>
 */
export const getCases = async (loginId: string): Promise<CaseData[]> => {
  // --- MOCK MODE ---
//   if (isMock) {
//     // 500ms er artificial delay
//     await new Promise(resolve => setTimeout(resolve, 500));
//     return MOCK_CASES;
//   }

  // --- LIVE MODE (Jokhon isMock = false hobe) ---
  const response = await fetch(`${BASE_URL}/GetAllCaseNumber?AppUserId=${loginId}`, {
    method: 'GET',
    headers: {
      'Content-Type': 'application/json',
      // Projon hole ekhane Auth token dite paren
    },
    credentials: 'include', // Projon hole ekhane Auth token dite paren
  });

  if (!response.ok) {
    throw new Error(`Failed to fetch cases: ${response.statusText}`);
  }

  const result = await response.json();
  const casesData = result.Data || result.data || [];
  
  return casesData.map((c: any, index: number) => {
    // Check if the API returned an array of strings
    if (typeof c === 'string') {
      return {
        id: c,
        caseName: c,
        parents: [],
        children: [],
        isGroup: false
      };
    }
    
    // Otherwise, treat it as an object
    const caseName = c.caseName || c.CaseName || c.CaseNumber || c.caseNumber || c.Name || c.Title || `Unknown-Case-${c.id || c.Id || index}`;
    return {
      id: c.id || c.Id || String(index),
      caseName: caseName,
      parents: c.parents || c.Parents || [],
      children: c.children || c.Children || [],
      isGroup: c.isGroup !== undefined ? c.isGroup : (c.IsGroup || false)
    };
  });
};

/**
 * Fetch detailed info (parents and children) for a specific case
 * @param caseNumber string
 * @returns Promise<CaseData | null>
 */
export const getCaseDetails = async (caseNumber: string): Promise<CaseData | null> => {
  // if (isMock) {
  //   await new Promise(resolve => setTimeout(resolve, 500));
  //   return MOCK_CASES.find(c => c.caseName === caseNumber) || null;
  // }

  try {
    const response = await fetch(`${BASE_URL}/GetAllChildOrParentInfo?caseNumber=${encodeURIComponent(caseNumber)}`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
      credentials: 'include',
    });

    if (!response.ok) {
      throw new Error(`Failed to fetch case details: ${response.statusText}`);
    }

    const result = await response.json();
    
    return {
      id: result.CaseId || result.id || '',
      caseName: result.CaseNumber || result.caseNumber || caseNumber,
      parents: result.Parents ? result.Parents.map((p: any) => ({ id: p.id, name: p.name })) : [],
      children: result.Children ? result.Children.map((c: any) => ({ id: c.id, name: c.name })) : [],
      isGroup: result.IsGroup !== undefined ? result.IsGroup : false
    };
  } catch (error) {
    console.error('Error fetching case details:', error);
    return null;
  }
};