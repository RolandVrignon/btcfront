import { Clock } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/src/components/ui/dialog";
import { DialogDescription } from "@radix-ui/react-dialog";

interface ChatbotDialogProps {
  isOpen: boolean;
  setIsOpen: (isOpen: boolean) => void;
  inputValue: string;
  isIndexationCompleted?: boolean;
}

export function ChatbotDialog({
  isOpen,
  setIsOpen,
  inputValue,
  isIndexationCompleted = false,
}: ChatbotDialogProps) {
  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogContent className="min-w-[90vw] min-h-[90vh] p-0 overflow-hidden rounded-xl flex flex-col">
        <DialogHeader>
          <DialogTitle className="sr-only">Chatbot</DialogTitle>
          <DialogDescription className="sr-only">Chatbot</DialogDescription>
        </DialogHeader>

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
            {isIndexationCompleted ? (
              <p className="text-gray-600 text-lg">
                Notre chatbot intelligent est prêt à répondre à vos questions
                techniques sur les documents indexés.
              </p>
            ) : (
              <p className="text-gray-600 text-lg">
                Notre chatbot intelligent est en cours de développement et sera
                bientôt disponible pour répondre à vos questions techniques.
              </p>
            )}

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
  );
}
