import React from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog'; // Adjust path if needed

// Define the props for our component
interface ViewContractModalProps {
  isOpen: boolean;
  onOpenChange: (isOpen: boolean) => void;
  pdfUrl: string;
  contractTitle?: string;
}

export const ViewContractModal: React.FC<ViewContractModalProps> = ({
  isOpen,
  onOpenChange,
  pdfUrl,
  contractTitle = 'Contract Document', // Default title
}) => {
  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-4xl bg-white  h-[90vh] flex flex-col">
        <DialogHeader>
          <DialogTitle>{contractTitle}</DialogTitle>
          <DialogDescription>
            Scroll to review the document. You can close this window when
            finished.
          </DialogDescription>
        </DialogHeader>

        <div className="flex-grow mt-4 overflow-hidden ">
          <iframe
            src={pdfUrl}
            title={contractTitle}
            className="w-full h-full"
            style={{ border: 'none' }}
          />
        </div>
      </DialogContent>
    </Dialog>
  );
};
