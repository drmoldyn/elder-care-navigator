"use client";

type TabType = "list" | "map" | "filters";

interface MobileTabsProps {
  activeTab: TabType;
  onTabChange: (tab: TabType) => void;
  filterCount: number;
}

export function MobileTabs({ activeTab, onTabChange, filterCount }: MobileTabsProps) {
  return (
    <div className="lg:hidden border-b border-sunset-orange/20 bg-white sticky top-0 z-10 shadow-sm">
      <div className="flex">
        <button
          onClick={() => onTabChange("list")}
          className={`flex-1 px-4 py-3 text-sm font-semibold transition-colors ${
            activeTab === "list"
              ? "text-sunset-orange border-b-2 border-sunset-orange"
              : "text-gray-600 hover:text-gray-900"
          }`}
        >
          List
        </button>
        <button
          onClick={() => onTabChange("map")}
          className={`flex-1 px-4 py-3 text-sm font-semibold transition-colors ${
            activeTab === "map"
              ? "text-sunset-orange border-b-2 border-sunset-orange"
              : "text-gray-600 hover:text-gray-900"
          }`}
        >
          Map
        </button>
        <button
          onClick={() => onTabChange("filters")}
          className={`flex-1 px-4 py-3 text-sm font-semibold transition-colors relative ${
            activeTab === "filters"
              ? "text-sunset-orange border-b-2 border-sunset-orange"
              : "text-gray-600 hover:text-gray-900"
          }`}
        >
          Filters
          {filterCount > 0 && (
            <span className="ml-1 inline-flex items-center justify-center w-5 h-5 text-xs font-bold text-white bg-sunset-orange rounded-full">
              {filterCount}
            </span>
          )}
        </button>
      </div>
    </div>
  );
}
