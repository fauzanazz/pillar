'use client';

import { useEffect, memo } from 'react';
import Link from 'next/link';
import { useContractStore } from '@/stores/contractStore';
import { useAuthStore } from '@/stores/authStore'; // Assuming auth store provides the role
import { Contract } from '@/constants/mockData';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import { MoreHorizontal, FileText } from 'lucide-react';
import { toast } from 'sonner';

// A reusable component for displaying the contract status pill
const StatusPill = ({ status }: { status: Contract['status'] }) => {
  const getStatusInfo = () => {
    switch (status) {
      case 'draft':
        return { label: 'Draft', className: 'bg-draft text-draft' };
      case 'legal_review':
        return { label: 'Legal Review', className: 'bg-review text-review' };
      case 'management_review':
        return {
          label: 'Management Review',
          className: 'bg-review text-review',
        };
      case 'accepted':
        return { label: 'Accepted', className: 'bg-accepted text-accepted' };
      case 'rejected':
        return { label: 'Rejected', className: 'bg-rejected text-rejected' };
      // case 'near_expire':
      //   return { label: 'Near Expire', className: 'bg-warning text-warning' };
      default:
        return { label: 'Unknown', className: 'bg-draft text-draft' };
    }
  };

  const { label, className } = getStatusInfo();

  return (
    <span
      className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${className}`}
    >
      {label}
    </span>
  );
};

interface ContractTableProps {
  filteredContracts?: Contract[];
}

const ContractTable = ({ filteredContracts }: ContractTableProps) => {
  // --- Hooks and State Management ---
  const { user } = useAuthStore(); // Fetched role from the authentication store
  const {
    contracts,
    fetchContracts,
    deleteContract, // Corrected function name
    updateContract, // Corrected function name
  } = useContractStore();

  useEffect(() => {
    fetchContracts();
  }, [fetchContracts]);

  const displayContracts = filteredContracts || contracts;

  // --- Render Logic ---
  if (!displayContracts || displayContracts.length === 0) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="flex flex-col items-center justify-center py-12 text-center">
            <FileText className="h-16 w-16 text-muted-foreground/50 mb-4" />
            <h3 className="text-xl font-semibold mb-2">No Contracts Found</h3>
            <p className="text-muted-foreground">
              Get started by creating your first contract.
            </p>
          </div>
        </CardContent>
      </Card>
    );
  }

  const role = user?.role;

  return (
    <Card>
      <CardContent className="p-0">
        <div className="overflow-x-auto">
          <Table>
            <TableHeader className="bg-muted/50">
              <TableRow>
                <TableHead className="w-[80px]">ID</TableHead>
                <TableHead>Contract Name</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>End Date</TableHead>

                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {displayContracts.map(c => (
                <TableRow key={c.id}>
                  <TableCell className="font-medium">{c.id}</TableCell>
                  <TableCell>{c.title}</TableCell>

                  <TableCell>
                    <StatusPill status={c.status} />
                  </TableCell>
                  <TableCell>
                    {c.endDate ? new Date(c.endDate).toLocaleDateString() : '-'}
                  </TableCell>
                  <TableCell className="text-right">
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon">
                          <MoreHorizontal className="h-4 w-4" />
                          <span className="sr-only">Actions</span>
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        {/* --- Internal User Actions --- */}
                        {user?.role === 'internal' && (
                          <>
                            <DropdownMenuItem
                              onClick={() => {
                                // updateContract(c.id, {
                                //   version: c.version + 1,
                                // });
                                toast.info('Version for contract bumped');
                              }}
                            >
                              Edit (mock)
                            </DropdownMenuItem>
                            <DropdownMenuItem
                              onClick={() => {
                                // Replicated 'sendToLegal' logic using 'updateContract'
                                updateContract(c.id, {
                                  status: 'legal_review',
                                });

                                toast.info('Sent to Legal Review');
                              }}
                            >
                              Send to Next Step
                            </DropdownMenuItem>
                            <AlertDialog>
                              <AlertDialogTrigger asChild>
                                <DropdownMenuItem
                                  className="text-destructive"
                                  onSelect={e => e.preventDefault()} // Prevents dropdown from closing
                                >
                                  Delete...
                                </DropdownMenuItem>
                              </AlertDialogTrigger>
                              <AlertDialogContent>
                                <AlertDialogHeader>
                                  <AlertDialogTitle>
                                    Are you sure you want to delete "{c.title}"?
                                  </AlertDialogTitle>
                                </AlertDialogHeader>
                                <AlertDialogFooter>
                                  <AlertDialogCancel>Cancel</AlertDialogCancel>
                                  <AlertDialogAction
                                    className="bg-destructive hover:bg-destructive/90"
                                    onClick={() => {
                                      deleteContract(c.id);
                                      toast.info(`Contract ${c.title} deleted`);
                                    }}
                                  >
                                    Delete
                                  </AlertDialogAction>
                                </AlertDialogFooter>
                              </AlertDialogContent>
                            </AlertDialog>
                          </>
                        )}
                        {/* --- Legal User Actions --- */}
                        {role === 'legal' && (
                          <DropdownMenuItem asChild>
                            <Link href={`/legal/review/${c.id}`}>Review</Link>
                          </DropdownMenuItem>
                        )}
                        {/* --- Management User Actions --- */}
                        {role === 'management' && (
                          <DropdownMenuItem asChild>
                            <Link href={`/management/review/${c.id}`}>
                              Review
                            </Link>
                          </DropdownMenuItem>
                        )}
                        {/* --- Common Actions --- */}
                        <DropdownMenuItem asChild>
                          <a
                            href={`/review/${c.id}` || '#'}
                            target="_blank"
                            rel="noreferrer"
                          >
                            Open URL
                          </a>
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </CardContent>
    </Card>
  );
};

export default memo(ContractTable);
