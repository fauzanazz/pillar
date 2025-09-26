'use client';

import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { toast } from 'sonner';
import { X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Contract } from '@/types/contract';

interface EditContractModalProps {
  isOpen: boolean;
  contract: Contract | null;
  onClose: () => void;
  onSubmit: (id: string, updates: Partial<Contract>) => void;
}

const editContractSchema = z.object({
  title: z.string().min(1, 'Nama contract is required'),
  description: z.string().min(10, 'Deskripsi must be at least 10 characters'),
  endDate: z.string().min(1, 'End date is required'),
  parties: z.string().min(1, 'At least one party is required'),
  contractUrl: z.string().optional(),
  startDate: z.string().min(1, 'Start date is required'),
  amount: z.string().optional(),
});

type EditContractForm = z.infer<typeof editContractSchema>;

export function EditContractModal({ isOpen, contract, onClose, onSubmit }: EditContractModalProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);

  const form = useForm<EditContractForm>({
    resolver: zodResolver(editContractSchema),
    defaultValues: {
      title: '',
      description: '',
      endDate: '',
      parties: '',
      contractUrl: '',
      startDate: '',
      amount: '',
    },
  });

  // Update form when contract changes
  useEffect(() => {
    if (contract) {
      form.reset({
        title: contract.title,
        description: contract.description,
        endDate: contract.endDate,
        parties: contract.parties.map(p => `${p.name} (${p.representation})`).join(', '),
        contractUrl: contract.contractUrl || '',
        startDate: contract.startDate,
        amount: contract.amount || '',
      });
    }
  }, [contract, form]);

  const handleSubmit = async (data: EditContractForm) => {
    if (!contract) return;

    setIsSubmitting(true);

    try {
      const updates: Partial<Contract> = {
        title: data.title,
        description: data.description,
        endDate: data.endDate,
        startDate: data.startDate,
        amount: data.amount || undefined,
      };

      await onSubmit(contract.id, updates);
      onClose();
      toast.success('Contract updated successfully!');
    } catch (error) {
      toast.error('Failed to update contract. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!isOpen || !contract) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
      <div className="bg-white rounded-lg shadow-lg w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between p-6 border-b">
          <h2 className="text-xl font-semibold">Edit Contract</h2>
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700"
          >
            <X className="h-6 w-6" />
          </button>
        </div>

        <form onSubmit={form.handleSubmit(handleSubmit)} className="p-6 space-y-6">
          {/* Nama */}
          <div className="space-y-2">
            <Label htmlFor="title">Nama Contract *</Label>
            <Input
              id="title"
              {...form.register('title')}
              placeholder="Enter contract name"
            />
            {form.formState.errors.title && (
              <p className="text-sm text-red-600">{form.formState.errors.title.message}</p>
            )}
          </div>

          {/* Deskripsi */}
          <div className="space-y-2">
            <Label htmlFor="description">Deskripsi *</Label>
            <textarea
              id="description"
              {...form.register('description')}
              placeholder="Enter contract description"
              className="w-full p-2 border border-gray-300 rounded-md min-h-[100px]"
            />
            {form.formState.errors.description && (
              <p className="text-sm text-red-600">{form.formState.errors.description.message}</p>
            )}
          </div>

          {/* Dates */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="startDate">Start Date *</Label>
              <Input
                id="startDate"
                type="date"
                {...form.register('startDate')}
              />
              {form.formState.errors.startDate && (
                <p className="text-sm text-red-600">{form.formState.errors.startDate.message}</p>
              )}
            </div>
            <div className="space-y-2">
              <Label htmlFor="endDate">End of Contract *</Label>
              <Input
                id="endDate"
                type="date"
                {...form.register('endDate')}
              />
              {form.formState.errors.endDate && (
                <p className="text-sm text-red-600">{form.formState.errors.endDate.message}</p>
              )}
            </div>
          </div>

          {/* Pihak */}
          <div className="space-y-2">
            <Label htmlFor="parties">Pihak (Parties) *</Label>
            <Input
              id="parties"
              {...form.register('parties')}
              placeholder="Enter parties separated by commas"
            />
            {form.formState.errors.parties && (
              <p className="text-sm text-red-600">{form.formState.errors.parties.message}</p>
            )}
            <p className="text-sm text-gray-500">Separate multiple parties with commas</p>
          </div>

          {/* Amount */}
          <div className="space-y-2">
            <Label htmlFor="amount">Amount (Optional)</Label>
            <Input
              id="amount"
              {...form.register('amount')}
              placeholder="e.g., $50,000"
            />
          </div>

          {/* URL Contract */}
          <div className="space-y-2">
            <Label htmlFor="contractUrl">URL Contract (Optional)</Label>
            <Input
              id="contractUrl"
              type="url"
              {...form.register('contractUrl')}
              placeholder="https://example.com/contract.pdf"
            />
          </div>

          {/* Current Status Display */}
          <div className="space-y-2">
            <Label>Current Status</Label>
            <div className="p-2 bg-gray-100 rounded-md">
              <span className="text-sm text-gray-700">
                Status: <span className="font-medium capitalize">{contract.status.replace('_', ' ')}</span>
              </span>
              <br />
              <span className="text-sm text-gray-700">
                Version: <span className="font-medium">{contract.version}</span>
              </span>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex justify-end gap-3 pt-4 border-t">
            <Button
              type="button"
              variant="outline"
              onClick={onClose}
              disabled={isSubmitting}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={isSubmitting}
            >
              {isSubmitting ? 'Updating...' : 'Update Contract'}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}