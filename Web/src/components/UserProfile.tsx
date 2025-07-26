
import { UserButton, useUser } from '@clerk/clerk-react';
import { Button } from '@/components/ui/button';
import { useUserProfile } from '@/hooks/useUserProfile';

interface UserProfileProps {
  onGetStarted: () => void;
}

const UserProfile = ({ onGetStarted }: UserProfileProps) => {
  const { user } = useUser();
  const { profile, syncProfile } = useUserProfile();

  const handleSyncProfile = async () => {
    await syncProfile();
  };

  return (
    <div className="flex items-center gap-4">
      <div className="flex items-center gap-3">
        <span className="text-white/90 font-medium">
          Welcome, {profile?.first_name || user?.firstName || 'User'}!
        </span>
        <UserButton 
          appearance={{
            elements: {
              avatarBox: "w-10 h-10"
            }
          }}
        />
        <Button 
          onClick={handleSyncProfile}
          variant="outline"
          size="sm"
          className="text-xs"
        >
          Sync Profile
        </Button>
      </div>
      <Button 
        onClick={onGetStarted}
        size="lg" 
        className="bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 text-white px-8 py-4 text-lg font-semibold rounded-full shadow-2xl hover:shadow-purple-500/25 transition-all duration-300 hover:scale-105 hover:-translate-y-1"
      >
        Start Creating
      </Button>
    </div>
  );
};

export default UserProfile;
