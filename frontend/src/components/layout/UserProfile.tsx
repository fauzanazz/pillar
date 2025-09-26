import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { LogOut } from 'lucide-react';

interface UserProfileProps {
  name: string;
  role: string;
}

const UserProfile = ({ name, role }: UserProfileProps) => {
  // Placeholder for the actual logout function
  const handleLogout = () => {
    console.log('User logged out');
    // Add your actual logout logic here (e.g., clear session, redirect)
  };

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
            <p className="font-semibold text-sm"></p>
            <p className="text-xs text-muted-foreground">Administrator</p>
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
