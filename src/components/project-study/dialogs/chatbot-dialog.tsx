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
      <DialogContent className="w-[90vw] h-[90vh] max-w-[90vw] max-h-[90vh] p-6 overflow-hidden">
        <DialogHeader>
          <DialogTitle className="text-xl font-semibold">
            Assistant IA
          </DialogTitle>
          <DialogDescription className="sr-only">
            Dialogue avec l'assistant IA
          </DialogDescription>
        </DialogHeader>

        <div className="flex-grow overflow-hidden mt-4 h-[calc(90vh-140px)] mx-[20vw]">
          <iframe
            src="http://localhost:8080/chat/038ca11a-f0ae-4c44-8d9f-b2bcb1f3eca0?apiKey=sk_43898650f1c6d5c9998163a996376c8251b4ea93185576cd&message=Bonjour"
            className="w-full h-full border-0"
            title="Assistant IA"
            sandbox="allow-scripts allow-same-origin allow-forms allow-popups"
          />
        </div>
      </DialogContent>
    </Dialog>
  );
}
