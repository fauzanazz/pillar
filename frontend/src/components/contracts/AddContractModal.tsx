'use client';

import { useState } from 'react';
import { useForm, useFieldArray } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { toast } from 'sonner';
import { X, Plus, Trash2, Sparkles } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Contract, Party } from '@/constants/mockData';

interface AddContractModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (contract: Omit<Contract, 'id'>) => void;
}

const partySchema = z.object({
  name: z.string().min(1, 'Party name is required'),
  representation: z.string().min(1, 'Representation is required'),
});

const contractSchema = z.object({
  title: z.string().min(1, 'Contract name is required'),
  description: z.string().min(10, 'Description must be at least 10 characters'),
  endDate: z.string().min(1, 'End date is required'),
  parties: z.array(partySchema).min(2, 'At least 2 parties are required'),
});

type ContractForm = z.infer<typeof contractSchema>;

// Mock AI contract generation function
const generateContract = async (data: ContractForm): Promise<string> => {
  // Simulate AI processing time
  await new Promise(resolve => setTimeout(resolve, 3000));

  const partiesText = data.parties
    .map(
      (party, index) => `${index + 1}. ${party.name} (${party.representation})`
    )
    .join('\n');

  return `
CONTRACT AGREEMENT

Title: ${data.title}

Description: ${data.description}

Parties:
${partiesText}

Contract Duration: Until ${data.endDate}

Terms and Conditions:
1. This contract governs the relationship between the parties as outlined above.
2. All parties agree to fulfill their respective obligations as defined in this agreement.
3. This contract shall remain in effect until ${data.endDate} unless terminated earlier by mutual consent.
4. Any disputes arising from this contract shall be resolved through arbitration.
5. This contract is binding upon all parties and their respective successors.

Generated on: ${new Date().toLocaleDateString()}

[This is an AI-generated contract template. Please review and modify as needed.]
  `.trim();
};

export function AddContractModal({
  isOpen,
  onClose,
  onSubmit,
}: AddContractModalProps) {
  const [isGenerating, setIsGenerating] = useState(false);

  const form = useForm<ContractForm>({
    resolver: zodResolver(contractSchema),
    defaultValues: {
      title: '',
      description: '',
      endDate: '',
      parties: [
        { name: '', representation: '' },
        { name: '', representation: '' },
      ],
    },
  });

  const { fields, append, remove } = useFieldArray({
    name: 'parties',
    control: form.control,
  });

  const addParty = () => {
    append({ name: '', representation: '' });
  };

  const removeParty = (index: number) => {
    if (fields.length > 2) {
      remove(index);
    }
  };

  const handleSubmit = async (data: ContractForm) => {
    setIsGenerating(true);

    try {
      // Generate AI contract
      const generatedContract = await generateContract(data);

      const newContract: Omit<Contract, 'id'> = {
        title: data.title,
        description: data.description,
        endDate: data.endDate,
        parties: data.parties,
        status: 'draft',
        version: '1.0',
        generatedContract,
        // Backward compatibility fields
        counterparty: data.parties[0]?.name || '',
        startDate: new Date().toISOString().split('T')[0],
        createdBy: 'Sarah Internal', // In real app, get from auth store
      };

      await onSubmit(newContract);

      // Reset form
      form.reset();
      onClose();

      toast.success('Contract created successfully with AI generation!');
    } catch (error) {
      toast.error('Failed to create contract. Please try again.');
    } finally {
      setIsGenerating(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
      {/* Modal container with flex column layout to manage header, body, and footer */}
      <div className="bg-white rounded-lg shadow-lg w-full max-w-2xl max-h-[90vh] flex flex-col">
        {/* Header (fixed) */}
        <div className="flex items-center justify-between p-6 border-b flex-shrink-0">
          <h2 className="text-xl font-semibold">Create New Contract</h2>
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700"
            disabled={isGenerating}
          >
            <X className="h-6 w-6" />
          </button>
        </div>

        {/* Form now acts as a layout container for the scrollable area and the footer */}
        <form
          onSubmit={form.handleSubmit(handleSubmit)}
          className="flex flex-col flex-grow overflow-hidden"
        >
          {/* Scrollable Body section */}
          <div className="flex-grow p-6 space-y-6 overflow-y-auto">
            {/* Contract Name */}
            <div className="space-y-2">
              <Label htmlFor="title">Contract Name *</Label>
              <Input
                id="title"
                {...form.register('title')}
                placeholder="Enter contract name"
                disabled={isGenerating}
              />
              {form.formState.errors.title && (
                <p className="text-sm text-red-600">
                  {form.formState.errors.title.message}
                </p>
              )}
            </div>

            {/* Contract Description */}
            <div className="space-y-2">
              <Label htmlFor="description">Contract Description *</Label>
              <textarea
                id="description"
                {...form.register('description')}
                placeholder="Describe the purpose and scope of this contract"
                className="w-full p-3 border border-gray-300 rounded-md min-h-[120px] resize-none"
                disabled={isGenerating}
              />
              {form.formState.errors.description && (
                <p className="text-sm text-red-600">
                  {form.formState.errors.description.message}
                </p>
              )}
            </div>

            {/* End Date */}
            <div className="space-y-2">
              <Label htmlFor="endDate">End of Contract *</Label>
              <Input
                id="endDate"
                type="date"
                {...form.register('endDate')}
                disabled={isGenerating}
              />
              {form.formState.errors.endDate && (
                <p className="text-sm text-red-600">
                  {form.formState.errors.endDate.message}
                </p>
              )}
            </div>

            {/* Parties */}
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <Label>Parties *</Label>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={addParty}
                  className="flex items-center gap-2"
                  disabled={isGenerating}
                >
                  <Plus className="h-4 w-4" />
                  Add Party
                </Button>
              </div>

              {fields.map((field, index) => (
                <div
                  key={field.id}
                  className="border border-gray-200 rounded-lg p-4 space-y-3"
                >
                  <div className="flex items-center justify-between">
                    <h4 className="text-sm font-medium">Party {index + 1}</h4>
                    {fields.length > 2 && (
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() => removeParty(index)}
                        className="h-8 w-8 p-0 text-red-600"
                        disabled={isGenerating}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    )}
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <Label htmlFor={`party-name-${index}`}>Name *</Label>
                      <Input
                        id={`party-name-${index}`}
                        {...form.register(`parties.${index}.name`)}
                        placeholder="Company/Person name"
                        disabled={isGenerating}
                      />
                      {form.formState.errors.parties?.[index]?.name && (
                        <p className="text-xs text-red-600 mt-1">
                          {form.formState.errors.parties[index]?.name?.message}
                        </p>
                      )}
                    </div>

                    <div>
                      <Label htmlFor={`party-representation-${index}`}>
                        Representation *
                      </Label>
                      <Input
                        id={`party-representation-${index}`}
                        {...form.register(`parties.${index}.representation`)}
                        placeholder="e.g., Client, Vendor, Partner"
                        disabled={isGenerating}
                      />
                      {form.formState.errors.parties?.[index]
                        ?.representation && (
                        <p className="text-xs text-red-600 mt-1">
                          {
                            form.formState.errors.parties[index]?.representation
                              ?.message
                          }
                        </p>
                      )}
                    </div>
                  </div>
                </div>
              ))}

              {form.formState.errors.parties && (
                <p className="text-sm text-red-600">
                  {form.formState.errors.parties.message}
                </p>
              )}
            </div>
          </div>
          {/* Footer (fixed) */}
          <div className="flex justify-end gap-3 p-6 border-t flex-shrink-0">
            <Button
              type="button"
              variant="outline"
              onClick={onClose}
              disabled={isGenerating}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={isGenerating}
              className="flex items-center gap-2"
            >
              {isGenerating ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                  Generating Contract...
                </>
              ) : (
                <>
                  <Sparkles className="h-4 w-4" />
                  Generate Contract with AI
                </>
              )}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
