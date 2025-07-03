import { Settings } from "lucide-react";

import { Button } from "./ui/button";

export default function SideBarFooter({
  setCurrentPage,
}: {
  setCurrentPage: (page: string) => void;
}) {
  return (
    <div className="flex-shrink-0 p-2 border-t border-gray-700">
      <Button
        variant="ghost"
        className="w-full justify-start gap-3 text-gray-300 hover:text-white hover:bg-gray-700 h-auto py-2 px-3 rounded-lg"
        onClick={() => setCurrentPage("pricing")}
      >
        <Settings className="w-4 h-4 flex-shrink-0" />
        <div className="flex flex-col items-start text-left">
          <span className="text-sm font-medium">Upgrade plan</span>
          <span className="text-xs text-gray-500">
            More access to the best models
          </span>
        </div>
      </Button>
    </div>
  );
}
