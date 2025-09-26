'use client';

import { Eye, MoreHorizontal } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { ContractWithRelations } from '@/api';
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
import Link from 'next/link';

interface ManagementContractsTableProps {
  contracts: ContractWithRelations[];
  currentPage: number;
  totalPages: number;
  totalItems: number;
  itemsPerPage: number;
  loading: boolean;
  onPageChange: (page: number) => void;
}

export function ManagementContractsTable({
  contracts,
  currentPage,
  totalPages,
  totalItems,
  itemsPerPage,
  loading,
  onPageChange,
}: ManagementContractsTableProps) {
  const indexOfFirstItem = (currentPage - 1) * itemsPerPage;

  return (
    <>
      <div className="overflow-x-auto">
        <Table className="w-full border-collapse bg-white shadow-sm rounded-lg overflow-hidden">
          <TableHeader>
            <TableRow className="bg-gray-50">
              <TableHead className="px-4 py-3 text-left text-sm font-medium text-gray-900 border-b">
                Name
              </TableHead>
              <TableHead className="px-4 py-3 text-left text-sm font-medium text-gray-900 border-b">
                Legal Reviewer
              </TableHead>
              <TableHead className="px-4 py-3 text-left text-sm font-medium text-gray-900 border-b">
                End of Contract
              </TableHead>
              <TableHead className="px-4 py-3 text-left text-sm font-medium text-gray-900 border-b">
                Status
              </TableHead>
              <TableHead className="px-4 py-3 text-center text-sm font-medium text-gray-900 border-b">
                Actions
              </TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading ? (
              <TableRow>
                <TableCell colSpan={5} className="text-center py-8">
                  <p className="text-gray-500">Loading contracts...</p>
                </TableCell>
              </TableRow>
            ) : contracts.length > 0 ? (
              contracts.map(contract => (
                <TableRow
                  key={contract.id}
                  className="border-b hover:bg-gray-50"
                >
                  <TableCell className="px-4 py-4 text-sm text-gray-900">
                    <div className="font-medium">{contract.title}</div>
                  </TableCell>
                  <TableCell className="px-4 py-4 text-sm text-gray-600">
                    {/* Placeholder for Legal Reviewer */}
                    {'Legal Team'}
                  </TableCell>
                  <TableCell className="px-4 py-4 text-sm text-gray-900">
                    {new Date(contract.endDate).toLocaleDateString()}
                  </TableCell>
                  <TableCell className="px-4 py-4">
                    <span
                      className={`inline-flex px-2 py-1 text-xs font-medium rounded-full`}
                    >
                      {contract.status}
                    </span>
                  </TableCell>
                  <TableCell className="px-4 py-4 flex items-center justify-center">
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon">
                          <MoreHorizontal className="h-4 w-4" />
                          <span className="sr-only">Actions</span>
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="center">
                        <DropdownMenuItem asChild>
                          <Link
                            href={`/management/review/${contract.id}`}
                            className="flex items-center"
                          >
                            <Eye className="mr-2 h-4 w-4" />
                            <span>Review Contract</span>
                          </Link>
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell colSpan={5}>
                  <div className="text-center py-8 text-gray-500">
                    No contracts awaiting management approval.
                  </div>
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>

      {totalPages > 1 && (
        <div className="flex items-center justify-between mt-4">
          <span className="text-sm text-gray-700">
            Showing {indexOfFirstItem + 1} to{' '}
            {Math.min(indexOfFirstItem + itemsPerPage, totalItems)} of{' '}
            {totalItems} Contracts
          </span>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => onPageChange(currentPage - 1)}
              disabled={currentPage === 1}
            >
              Previous
            </Button>
            <span className="text-sm font-medium text-gray-800">
              Page {currentPage} of {totalPages}
            </span>
            <Button
              variant="outline"
              size="sm"
              onClick={() => onPageChange(currentPage + 1)}
              disabled={currentPage === totalPages}
            >
              Next
            </Button>
          </div>
        </div>
      )}
    </>
  );
}
