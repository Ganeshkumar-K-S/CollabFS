import React from 'react'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Plus } from 'lucide-react';
import {getData} from '@/utils/localStorage'

const GroupDailog = ({ isDialogOpen, setIsDialogOpen, groupName, setGroupName, groupDescription, setGroupDescription, handleDialogClose }) => {
  const userId = getData('userId');
  const handleCreateGroup = async () => {
    if (!groupName.trim()) return;
    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_BACKEND_URL}/group/create`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-api-key": process.env.NEXT_PUBLIC_GROUP_API_KEY,
        },
        body: JSON.stringify({
          userId: userId,
          name: groupName,
          description: groupDescription,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.detail || "Group creation failed");
      }

      console.log("Group created:", data);
      setIsDialogOpen(false);
      setGroupName("");
      setGroupDescription("");
    } catch (err) {
      console.error("Error creating group:", err.message);
    }
  };

  return (
    <div>
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogTrigger asChild>
          <Button
            className="fixed bottom-6 right-6 h-14 w-14 rounded-full shadow-lg hover:shadow-xl transition-shadow bg-blue-600 hover:bg-blue-700"
            size="icon"
          >
            <Plus className="h-6 w-6" />
          </Button>
        </DialogTrigger>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Create New Group</DialogTitle>
            <DialogDescription>
              Add a new group to collaborate with others. You can always edit these details later.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="group-name" className="text-right">
                Name
              </Label>
              <Input
                id="group-name"
                placeholder="Enter group name"
                value={groupName}
                onChange={(e) => setGroupName(e.target.value)}
                className="col-span-3"
              />
            </div>
            <div className="grid grid-cols-4 items-start gap-4">
              <Label htmlFor="group-description" className="text-right pt-2">
                Description
              </Label>
              <Textarea
                id="group-description"
                placeholder="Enter group description (optional)"
                value={groupDescription}
                onChange={(e) => {
                  if (e.target.value.length <= 1000) {
                    setGroupDescription(e.target.value);
                  }
                }}
                className="col-span-3 min-h-[80px]"
              />
            </div>
          </div>
          <DialogFooter>
            <Button 
              type="button" 
              variant="outline" 
              onClick={handleDialogClose}
            >
              Cancel
            </Button>
            <Button 
              type="submit" 
              onClick={handleCreateGroup}
              disabled={!groupName.trim()}
            >
              Create Group
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

export default GroupDailog