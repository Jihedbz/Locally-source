import { Alert, AlertTitle, AlertDescription } from "@/components/ui/alert";
import { Terminal } from "lucide-react";
import { useAlertStore } from "@/store/alertStore";
import { useEffect } from "react";

const GlobalAlert = () => {
  const { isOpen, type, message, hide } = useAlertStore();

  useEffect(() => {
    if (isOpen) {
      const timer = setTimeout(() => {
        hide();
      }, 3000); // Adjust the duration as needed
      return () => clearTimeout(timer);
    }
  }, [isOpen, hide]);

  if (!isOpen || !type || !message) {
    return null;
  }

  return (
    <div className="z-[1000] fixed bottom-6 right-6 p-4 rounded-md w-72 transition-opacity duration-5000 ease-in-out">
      <Alert variant={type === "success" ? "default" : "destructive"}>
        <Terminal className="h-4 w-4" />
        <AlertTitle>{type === "success" ? "✅ Success!" : "❌ Oops!"}</AlertTitle>
        <AlertDescription>{message}</AlertDescription>
      </Alert>
    </div>
  );
};

export default GlobalAlert;