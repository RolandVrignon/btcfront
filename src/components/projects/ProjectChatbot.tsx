import { useState } from "react";
import { Dialog, DialogContent } from "@/src/components/ui/dialog";
import { Clock } from "lucide-react";
import { PlaceholdersAndVanishInput } from "../ui/placeholder-vanish-input";

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

      <Dialog open={isOpen} onOpenChange={setIsOpen}>
        <DialogContent className="min-w-[90vw] min-h-[90vh] p-0 overflow-hidden rounded-xl flex flex-col">
          <div className="absolute top-0 left-0 p-6 text-left">
            <div className="flex items-center gap-3">
              <Clock className="h-6 w-6 text-blue-500" />
              <h2 className="text-xl font-medium text-gray-800">
                Fonctionnalité à venir
              </h2>
            </div>
          </div>

          <div className="p-6 flex-grow flex items-center justify-center">
            <div className="flex flex-col gap-6 items-center text-center max-w-2xl">
              <p className="text-gray-600 text-lg">
                Notre chatbot intelligent est en cours de développement et sera
                bientôt disponible pour répondre à vos questions techniques.
              </p>

              {inputValue && (
                <div className="mt-2 p-6 bg-gray-50 border border-gray-100 rounded-lg w-full">
                  <p className="text-sm text-gray-500 mb-2">Votre question :</p>
                  <p className="text-blue-600 font-medium text-lg">
                    {inputValue}
                  </p>
                </div>
              )}

              <div className="bg-amber-50 border-l-4 border-amber-400 p-6 rounded-r-lg w-full">
                <p className="text-amber-700">
                  Nous travaillons activement sur cette fonctionnalité pour vous
                  offrir une assistance IA de qualité. Merci de votre patience !
                </p>
              </div>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
