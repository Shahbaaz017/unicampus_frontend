// src/lib/utils.ts
import { type ClassValue, clsx } from "clsx"
import { twMerge } from "tailwind-merge"
import { Author } from '@/types/community'; // Ensure this path is correct for your Author type

export function cn(...inputs: ClassValue[]) { // This is likely from shadcn/ui setup
  return twMerge(clsx(inputs))
}

// 👇 ENSURE THIS FUNCTION IS EXACTLY AS DEFINED AND EXPORTED
export const formatAuthorDisplay = (author?: Author): string => {
  if (!author) return "Unknown User";
  
  const namePart = author.name || "User";
  
  const usnSuffix = author.usn && author.usn.length >= 3 
                    ? ` (${author.usn.slice(-3)})` 
                    : (author.usn ? ` (${author.usn})` : ""); 

  return `${namePart}${usnSuffix}`;
};

// 👇 ENSURE THIS FUNCTION IS ALSO EXPORTED
export const formatTimeAgo = (isoDate?: string): string => {
    if (!isoDate) return 'some time ago';
    const date = new Date(isoDate);
    const now = new Date();
    const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000);

    if (diffInSeconds < 5) return 'Just now';
    if (diffInSeconds < 60) return `${diffInSeconds}s ago`;

    const diffInMinutes = Math.floor(diffInSeconds / 60);
    if (diffInMinutes < 60) return `${diffInMinutes}m ago`;

    const diffInHours = Math.floor(diffInMinutes / 60);
    if (diffInHours < 24) return `${diffInHours}h ago`;

    const diffInDays = Math.floor(diffInHours / 24);
    if (diffInDays < 7) return `${diffInDays}d ago`;
    
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
};