import { BookOpen, Search, Edit, Brain } from "lucide-react";

import { Bot, Sparkles } from "lucide-react";
import CustomSidePannelTopButton from "./CustomSidePannelTopButton";

export default function SideBarNavigation({
  handleNewChat,
  setCurrentPage,
}: {
  handleNewChat: () => void;
  setCurrentPage: (page: string) => void;
}) {
  return (
    <div className="flex-shrink-0 flex flex-col  px-1 pb-2">
      <CustomSidePannelTopButton
        buttonText="New chat"
        icon={<Edit />}
        onClick={handleNewChat}
      />

      <div className="mb-4">
        <CustomSidePannelTopButton
          buttonText="Search chats"
          icon={<Search />}
          onClick={() => setCurrentPage("chat")}
        />

        <CustomSidePannelTopButton
          buttonText="Library"
          icon={<BookOpen />}
          onClick={() => setCurrentPage("chat")}
        />

        <CustomSidePannelTopButton
          buttonText="Memories"
          icon={<Brain />}
          onClick={() => setCurrentPage("memory")}
        />
      </div>

      <div>
        <CustomSidePannelTopButton
          buttonText="Sora"
          icon={<Sparkles />}
          onClick={() => setCurrentPage("chat")}
        />

        <CustomSidePannelTopButton
          buttonText="GPTs"
          icon={<Bot />}
          onClick={() => setCurrentPage("chat")}
        />
      </div>
    </div>
  );
}
