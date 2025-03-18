import { useState } from "react";
import { PlaceholdersAndVanishInput } from "../../ui/placeholder-vanish-input";
import { ChatbotDialog } from "@/src/components/project-study/dialogs/chatbot-dialog";

export function ProjectChatbot() {
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
    console.log("Question soumise:", inputValue);
    // Ouvrir la modale lors du submit
    setIsOpen(true);
  };

  return (
    <div className="mt-4">
      <h3 className="text-xl font-semibold mb-4">Chatbot Intelligent</h3>
      <div className="w-full h-[25vh] flex flex-col items-center justify-center font-medium rounded-xl hover:cursor-pointer relative overflow-hidden bg-stone-100">
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
        </div>
      </div>

      <ChatbotDialog
        isOpen={isOpen}
        setIsOpen={setIsOpen}
        inputValue={inputValue}
      />
    </div>
  );
}
