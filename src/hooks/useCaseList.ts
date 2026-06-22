import { useState, useCallback } from "react";
import type { CaseData, CasePerson } from "../types/caseNote";
import { getCases, getCaseDetails as getCaseDetailsApi } from "../services/caseListApiForLive";

export const useCaseList = (loginId: string) => {
  const [cases, setCases] = useState<CaseData[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchCases = async () => {
    setIsLoading(true);
    setError(null);
    
    try {
      // API request helper function call kora holo loginId shoho
      const data = await getCases(loginId);
      setCases(data);
    } catch (err: any) {
      setError('Failed to fetch cases');
      console.error('Error fetching cases:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const fetchCaseDetails = async (caseNumber: string): Promise<CaseData | null> => {
    try {
      const details = await getCaseDetailsApi(caseNumber);
      if (details) {
        setCases(prevCases => prevCases.map(c => 
          c.caseName === caseNumber ? { ...c, ...details } : c
        ));
      }
      return details;
    } catch (err) {
      console.error('Error fetching case details:', err);
      return null;
    }
  };

  // --- Baki helper functions gulo ager motoi thakbe ---

  const getCaseById = useCallback((caseName: string): CaseData | undefined => {
    return cases.find(c => c.caseName === caseName);
  }, [cases]);

  const getAllParents = useCallback((): CasePerson[] => {
    const allParents = cases.flatMap(c => c.parents || []);
    // Deduplicate by id
    const unique = new Map<string | number, CasePerson>();
    allParents.forEach(p => unique.set(p.id, p));
    return Array.from(unique.values()).sort((a, b) => a.name.localeCompare(b.name));
  }, [cases]);

  const getAllChildren = useCallback((): CasePerson[] => {
    const allChildren = cases.flatMap(c => c.children || []);
    // Deduplicate by id
    const unique = new Map<string | number, CasePerson>();
    allChildren.forEach(c => unique.set(c.id, c));
    return Array.from(unique.values()).sort((a, b) => a.name.localeCompare(b.name));
  }, [cases]);

  const getParentsByCase = useCallback((caseName: string): CasePerson[] => {
    const caseData = cases.find(c => c.caseName === caseName);
    return caseData?.parents || [];
  }, [cases]);

  const getChildrenByCase = useCallback((caseName: string): CasePerson[] => {
    const caseData = cases.find(c => c.caseName === caseName);
    return caseData?.children || [];
  }, [cases]);

  return { 
    cases, 
    isLoading, 
    error, 
    fetchCases, 
    fetchCaseDetails,
    getCaseById,
    getAllParents,
    getAllChildren,
    getParentsByCase,
    getChildrenByCase
  };
};