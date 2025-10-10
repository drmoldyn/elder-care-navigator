"use client";

import { createContext, useContext, useState, useEffect, ReactNode } from "react";

interface Resource {
  id: string;
  title: string;
  description: string;
  url: string;
  category: string[];
  conditions: string[];
  cost: string;
  contact_phone?: string;
  contact_email?: string;
  location_type: string;
  states?: string[];
  source_authority: string;
  best_for?: string;
  address?: string;
  city?: string;
  state?: string;
  zip?: string;
  insurance_accepted?: string[];
  available_beds?: number;
  overall_rating?: number;
  distance?: number;
}

interface ComparisonContextType {
  selectedFacilities: Resource[];
  addFacility: (facility: Resource) => void;
  removeFacility: (facilityId: string) => void;
  isSelected: (facilityId: string) => boolean;
  clearAll: () => void;
  maxSelection: number;
}

const ComparisonContext = createContext<ComparisonContextType | undefined>(undefined);

const MAX_COMPARISON = 4;
const STORAGE_KEY = "comparison-facilities";

export function ComparisonProvider({ children }: { children: ReactNode }) {
  const [selectedFacilities, setSelectedFacilities] = useState<Resource[]>([]);

  // Load from localStorage on mount
  useEffect(() => {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) {
      try {
        setSelectedFacilities(JSON.parse(stored));
      } catch (e) {
        console.error("Failed to parse stored comparison data", e);
      }
    }
  }, []);

  // Save to localStorage whenever selection changes
  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(selectedFacilities));
  }, [selectedFacilities]);

  const addFacility = (facility: Resource) => {
    setSelectedFacilities((prev) => {
      // Don't add if already selected
      if (prev.find((f) => f.id === facility.id)) {
        return prev;
      }
      // Don't add if we've reached the max
      if (prev.length >= MAX_COMPARISON) {
        return prev;
      }
      return [...prev, facility];
    });
  };

  const removeFacility = (facilityId: string) => {
    setSelectedFacilities((prev) => prev.filter((f) => f.id !== facilityId));
  };

  const isSelected = (facilityId: string) => {
    return selectedFacilities.some((f) => f.id === facilityId);
  };

  const clearAll = () => {
    setSelectedFacilities([]);
  };

  return (
    <ComparisonContext.Provider
      value={{
        selectedFacilities,
        addFacility,
        removeFacility,
        isSelected,
        clearAll,
        maxSelection: MAX_COMPARISON,
      }}
    >
      {children}
    </ComparisonContext.Provider>
  );
}

export function useComparison() {
  const context = useContext(ComparisonContext);
  if (context === undefined) {
    throw new Error("useComparison must be used within a ComparisonProvider");
  }
  return context;
}
