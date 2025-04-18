import { useState } from "react";
import { PlaceholdersAndVanishInput } from "../../ui/placeholder-vanish-input";
import { ChatbotDialog } from "@/src/components/project-study/dialogs/chatbot-dialog";
import { LoadingSpinner } from "../../ui/loading-spinner";
import { logger } from "@/src/utils/logger";

interface ProjectChatbotProps {
  isIndexationCompleted?: boolean;
  projectId: string | undefined;
}

export function ProjectChatbot({
  isIndexationCompleted = false,
  projectId,
}: ProjectChatbotProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [inputValue, setInputValue] = useState("");

  const placeholders = [
    "Quelles sont les non-conformités structurelles du bâtiment ?",
    "Comment vérifier la conformité incendie d'un ERP ?",
    "Quels sont les points de contrôle pour l'accessibilité PMR ?",
    "Expliquez-moi les exigences RT2020 pour l'isolation thermique",
    "Quelles sont les normes parasismiques à respecter pour ce projet ?",
    "Comment rédiger un rapport de contrôle technique pour un CCTP ?",
    "Quels sont les points d'attention pour la solidité des ouvrages ?",
  ];

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setInputValue(e.target.value);
  };

  const onSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    logger.debug("Question soumise:", inputValue);
    // Ouvrir la modale lors du submit
    setIsOpen(true);
  };

  return (
    <div className="mt-4">
      <div className="flex items-center gap-2 mb-4">
        <h3 className="text-xl font-semibold">Chatbot Intelligent</h3>
        {!isIndexationCompleted && (
          <div className="flex items-center text-xs text-purple-600 bg-purple-100 px-2 py-1 rounded-full whitespace-nowrap">
            <LoadingSpinner />
            Mise en mémoire des documents
          </div>
        )}
      </div>
      <div
        className="w-full h-[25vh] flex flex-col items-center justify-center font-medium rounded-xl hover:cursor-pointer relative overflow-hidden bg-stone-100"
        onClick={() => {
          if (isIndexationCompleted) {
            setIsOpen(true);
          }
        }}
      >
        <div
          className="w-full h-[25vh] flex flex-col items-center justify-center font-medium rounded-xl hover:cursor-pointer relative overflow-hidden bg-stone-100"
          style={{
            background:
              "radial-gradient(circle, #888888 1px, transparent 1px) 0 0 / 20px 20px",
          }}
        >
          <div className="z-10 w-full">
            <PlaceholdersAndVanishInput
              placeholders={placeholders}
              onChange={handleChange}
              onSubmit={onSubmit}
            />
          </div>

          {/* Overlay de chargement qui empêche de cliquer sur l'input */}
          {!isIndexationCompleted && (
            <div className="absolute inset-0 z-20 backdrop-blur-[2px] flex items-center justify-center pointer-events-auto rounded-xl hover:cursor-not-allowed"></div>
          )}
        </div>
      </div>

      <ChatbotDialog
        isOpen={isOpen}
        setIsOpen={setIsOpen}
        inputValue={inputValue}
        projectId={projectId}
      />
    </div>
  );
}
