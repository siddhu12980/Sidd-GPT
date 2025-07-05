import { Dialog, DialogContent } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { useRouter } from "next/navigation";

export default function LoginRequiredModal({
  open,
  onClose,
}: {
  open: boolean;
  onClose: () => void;
}) {
  const router = useRouter();
  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-xs p-0 overflow-hidden">
        <div className="bg-gradient-to-tr from-indigo-200 to-pink-100 h-24 w-full" />
        <div className="p-4">
          <h2 className="font-semibold text-lg mb-2">
            Try advanced features for free
          </h2>
          <p className="text-sm text-gray-500 mb-4">
            Get smarter responses, upload files, create images, and more by
            logging in.
          </p>
          <div className="flex gap-2">
            <Button className="w-full" onClick={() => router.push("/sign-in")}>
              Log in
            </Button>
            <Button
              variant="outline"
              className="w-full"
              onClick={() => router.push("/sign-up")}
            >
              Sign up for free
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
