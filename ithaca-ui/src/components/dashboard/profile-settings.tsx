"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { UserProfile } from "@/lib/api/dashboard-api";
import { Loader2 } from "lucide-react";

interface ProfileSettingsProps {
  profile: UserProfile;
}

export function ProfileSettings({ profile: initialProfile }: ProfileSettingsProps) {
  const [profile, setProfile] = useState(initialProfile);
  const [loading, setLoading] = useState(false);
  const [saved, setSaved] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setSaved(false);
    
    // Simulate API call
    await new Promise((resolve) => setTimeout(resolve, 1000));
    
    setLoading(false);
    setSaved(true);
    setTimeout(() => setSaved(false), 3000);
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Profile Information</CardTitle>
          <CardDescription>
            Update your account profile details and public information.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid gap-2">
              <label htmlFor="name" className="text-sm font-medium">Display Name</label>
              <Input 
                id="name" 
                value={profile.name} 
                onChange={(e) => setProfile({ ...profile, name: e.target.value })} 
              />
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="grid gap-2">
                <label htmlFor="institution" className="text-sm font-medium">Institution</label>
                <Input 
                  id="institution" 
                  value={profile.institution || ""} 
                  onChange={(e) => setProfile({ ...profile, institution: e.target.value })} 
                />
              </div>
              <div className="grid gap-2">
                <label htmlFor="department" className="text-sm font-medium">Department</label>
                <Input 
                  id="department" 
                  value={profile.department || ""} 
                  onChange={(e) => setProfile({ ...profile, department: e.target.value })} 
                />
              </div>
            </div>

            <div className="flex items-center gap-4">
              <Button type="submit" disabled={loading}>
                {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Save Changes
              </Button>
              {saved && (
                <p className="text-sm text-green-600 animate-in fade-in slide-in-from-left-2">
                  Changes saved successfully!
                </p>
              )}
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
