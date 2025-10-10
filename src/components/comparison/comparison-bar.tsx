"use client";

import { useComparison } from "@/contexts/comparison-context";
import { Button } from "@/components/ui/button";
import { useRouter } from "next/navigation";

export function ComparisonBar() {
  const { selectedFacilities, clearAll } = useComparison();
  const router = useRouter();

  if (selectedFacilities.length === 0) {
    return null;
  }

  return (
    <div className="fixed bottom-0 left-0 right-0 z-50 border-t bg-white shadow-lg">
      <div className="mx-auto max-w-7xl px-4 py-3">
        <div className="flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2">
              <span className="text-sm font-medium text-gray-600">
                Compare Facilities:
              </span>
              <span className="rounded-full bg-indigo-600 px-3 py-1 text-sm font-bold text-white">
                {selectedFacilities.length}
              </span>
            </div>
            <div className="hidden sm:flex flex-wrap gap-2">
              {selectedFacilities.map((facility) => (
                <span
                  key={facility.id}
                  className="rounded-md bg-gray-100 px-2 py-1 text-xs text-gray-700"
                >
                  {facility.title.length > 30
                    ? facility.title.substring(0, 30) + "..."
                    : facility.title}
                </span>
              ))}
            </div>
          </div>

          <div className="flex items-center gap-2">
            <Button
              variant="ghost"
              size="sm"
              onClick={clearAll}
              className="text-gray-600 hover:text-gray-900"
            >
              Clear All
            </Button>
            <Button
              size="sm"
              onClick={() => router.push("/compare")}
              disabled={selectedFacilities.length < 2}
            >
              Compare {selectedFacilities.length > 1 ? `(${selectedFacilities.length})` : ""}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
