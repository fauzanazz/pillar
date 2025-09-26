import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { ChevronDown, LogOut } from 'lucide-react';

interface UserProfileProps {
  name: string;
  role: string;
  handleLogout?: () => void;
}

const UserProfile = ({ name, role, handleLogout }: UserProfileProps) => {
  // Placeholder for the actual logout function

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button className="flex items-center gap-3 p-2 rounded-lg hover:bg-muted transition-colors">
          <Avatar className="h-10 w-10">
            {/* The user's profile picture */}
            <AvatarImage src="https://github.com/shadcn.png" alt="@shadcn" />
            {/* Fallback initials if the image fails to load */}
            <AvatarFallback>CN</AvatarFallback>
          </Avatar>
          <div className="text-left">
            <p className="font-semibold text-base">{name}</p>
            <p className="text-sm text-muted-foreground">{role}</p>
          </div>

          <div className="flex items-start">
            <ChevronDown className="w-4 h-4 ml-2" />
          </div>
        </button>
      </DropdownMenuTrigger>

      <DropdownMenuContent className="w-56" align="end">
        <DropdownMenuItem
          onClick={handleLogout}
          className="cursor-pointer text-destructive focus:text-destructive focus:bg-destructive/10"
        >
          <LogOut className="mr-2 h-4 w-4" />
          <span>Logout</span>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
};

export default UserProfile;
