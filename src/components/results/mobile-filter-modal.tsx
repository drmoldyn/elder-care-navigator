"use client";

interface MobileFilterModalProps {
  isOpen: boolean;
  onClose: () => void;
  resultCount: number;
}

export function MobileFilterModal({ isOpen, onClose, resultCount }: MobileFilterModalProps) {
  if (!isOpen) return null;

  return (
    <div className="lg:hidden fixed inset-0 z-50 bg-white overflow-y-auto">
      {/* Header */}
      <div className="sticky top-0 bg-white border-b px-4 py-4 flex items-center justify-between">
        <h2 className="text-lg font-bold">Filters</h2>
        <button
          onClick={onClose}
          className="text-gray-500 hover:text-gray-700 p-2"
          aria-label="Close filters"
        >
          <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </div>

      {/* Filter Content */}
      <div className="p-6 space-y-6 pb-24">
        <div>
          <h3 className="mb-3 font-semibold text-base">Insurance Accepted</h3>
          <div className="space-y-3">
            {["Medicare", "Medicaid", "Private Insurance", "VA Benefits"].map((insurance) => (
              <label key={insurance} className="flex items-center gap-3">
                <input
                  type="checkbox"
                  className="h-5 w-5 rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
                />
                <span className="text-base">{insurance}</span>
              </label>
            ))}
          </div>
        </div>

        <div>
          <h3 className="mb-3 font-semibold text-base">Star Rating</h3>
          <div className="space-y-3">
            {[5, 4, 3, 2, 1].map((stars) => (
              <label key={stars} className="flex items-center gap-3">
                <input
                  type="checkbox"
                  className="h-5 w-5 rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
                />
                <span className="text-base">{"⭐".repeat(stars)} & up</span>
              </label>
            ))}
          </div>
        </div>

        <div>
          <h3 className="mb-3 font-semibold text-base">Availability</h3>
          <div className="space-y-3">
            <label className="flex items-center gap-3">
              <input
                type="checkbox"
                className="h-5 w-5 rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
              />
              <span className="text-base">Beds available now</span>
            </label>
          </div>
        </div>

        <div>
          <h3 className="mb-3 font-semibold text-base">Distance</h3>
          <input
            type="range"
            min="5"
            max="100"
            defaultValue="50"
            className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-indigo-600"
          />
          <div className="mt-2 flex justify-between text-sm text-gray-600">
            <span>5 miles</span>
            <span>50 miles</span>
            <span>100 miles</span>
          </div>
        </div>

        <button
          onClick={onClose}
          className="w-full text-center text-indigo-600 font-semibold py-2"
        >
          Clear All
        </button>
      </div>

      {/* Sticky Bottom Button */}
      <div className="fixed bottom-0 left-0 right-0 p-4 bg-white border-t">
        <button
          onClick={onClose}
          className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-semibold py-4 rounded-xl text-base transition-all"
        >
          Show {resultCount.toLocaleString()} Facilities
        </button>
      </div>
    </div>
  );
}
