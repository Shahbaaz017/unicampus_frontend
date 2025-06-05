// src/components/communities/PostListItem.tsx
import React, { useState, MouseEvent, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { 
    ChevronUp, ChevronDown, MessageSquare, ExternalLink, MoreHorizontal, Trash2, Loader2,
    Edit // <<< --- ADD THIS ICON
} from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  // DropdownMenuSeparator, // <<< --- OPTIONAL: If you want a separator
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import apiClient from '@/lib/apiClient';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from '@/hooks/use-toast';
import { Post, Author, CommunitySummary, VoteApiResponse, DeleteApiResponse } from '@/types/community';
import { formatTimeAgo, formatAuthorDisplay } from '@/lib/utils';

interface PostListItemProps {
  post: Post;
  index: number;
  showCommunity?: boolean;
  onClick: () => void;
  onVoteChange?: (postId: string, newVoteData: VoteApiResponse['data']) => void;
  onDeletePost?: (postId: string) => void;
  // Add a new prop for handling edit, can navigate or open a modal
  onEditPost?: (post: Post) => void;
}

const PostListItem: React.FC<PostListItemProps> = ({ 
  post, index, showCommunity = false, onClick, onVoteChange, onDeletePost, onEditPost 
}) => {
  const { isAuthenticated, user } = useAuth();
  const navigate = useNavigate();

  const [userVote, setUserVote] = useState<'up' | 'down' | null>(post.userVote);
  const [score, setScore] = useState((post.upvotes ?? 0) - (post.downvotes ?? 0));
  const [isVoting, setIsVoting] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  // Original author check - keep it for reference or quick revert
  const _isAuthor_original_check = isAuthenticated && user && post.author && user.id === post.author.id;
  // --- TEMPORARY FOR UI TESTING: Force show delete/edit button ---
  const isAuthor = true; // This will make the delete/edit option always visible for now
  // --- END TEMPORARY ---


  useEffect(() => {
    setUserVote(post.userVote);
    setScore((post.upvotes ?? 0) - (post.downvotes ?? 0));
  }, [post.userVote, post.upvotes, post.downvotes]);

  const handleVote = async (voteDirectionAttempt: 'up' | 'down', e: MouseEvent) => {
    // ... (keep existing handleVote logic)
    e.stopPropagation();
    if (!isAuthenticated) { toast({ title: "Authentication Required", description: "Please log in to vote.", variant: "destructive"}); return; }
    if (isVoting) return;
    setIsVoting(true);
    const originalUserVote = userVote; const originalScore = score;
    let newApiDirection: 'up' | 'down' | 'none' = userVote === voteDirectionAttempt ? 'none' : voteDirectionAttempt;
    let newOptimisticScore = score;
    if (newApiDirection === 'none') { if (originalUserVote === 'up') newOptimisticScore--; else if (originalUserVote === 'down') newOptimisticScore++; setUserVote(null); }
    else { if (originalUserVote === 'up') newOptimisticScore--; else if (originalUserVote === 'down') newOptimisticScore++;
           if (newApiDirection === 'up') newOptimisticScore++; else newOptimisticScore--; setUserVote(newApiDirection); }
    setScore(newOptimisticScore);
    try {
      const response = await apiClient<VoteApiResponse>(`/posts/${post.id}/vote`, { method: 'POST', data: { direction: newApiDirection } });
      if (response.status === 'success' && response.data) {
        setScore((response.data.upvotes ?? 0) - (response.data.downvotes ?? 0));
        setUserVote(response.data.user_vote);
        if (onVoteChange) onVoteChange(post.id, response.data);
      } else throw new Error((response as any).message || "Failed to record vote.");
    } catch (error: any) {
      toast({ title: "Error Voting", description: error.message || "Could not submit vote.", variant: "destructive" });
      setUserVote(originalUserVote); setScore(originalScore);
    } finally { setIsVoting(false); }
  };
  
  const displayedContent = post.contentText || post.contentPreview || "";
  const authorDisplay = formatAuthorDisplay(post.author);

  const handleDeletePostTrigger = (e: MouseEvent) => {
    e.stopPropagation();
    setShowDeleteConfirm(true);
  };

  const handleDeletePostConfirm = async (e?: MouseEvent) => {
    // ... (keep existing handleDeletePostConfirm logic - MOCK)
    e?.stopPropagation();
    setShowDeleteConfirm(false);
    setIsDeleting(true);
    try {
        await new Promise(resolve => setTimeout(resolve, 700)); 
        toast({ title: "Post Deleted (Mock)", description: `"${post.title}" has been removed.` });
        if (onDeletePost) { onDeletePost(post.id); }
    } catch (error: any) {
        toast({ title: "Error Deleting Post", description: error.message || "Could not delete post.", variant: "destructive"});
    } finally {
        setIsDeleting(false);
    }
  };

  // --- NEW: Handle Edit Post Trigger ---
  const handleEditPostTrigger = (e: MouseEvent) => {
    e.stopPropagation();
    // When real auth is back, uncomment:
    // if (!_isAuthor_original_check) { 
    //     toast({ title: "Unauthorized", description: "You cannot edit this post.", variant: "destructive" });
    //     return;
    // }
    toast({ title: "Edit Post (Mock)", description: `Edit action triggered for "${post.title}". Implement navigation or modal here.` });
    if (onEditPost) {
      onEditPost(post); // Propagate the post object for potential parent handling
    }
    // Example: navigate(`/posts/${post.id}/edit`); // Or open an edit modal
  };
  // --- END NEW ---

  return (
    <>
      <Card
        className="animate-slide-up cursor-pointer hover:shadow-lg transition-all dark:bg-gray-800"
        style={{ animationDelay: `${index * 0.05}s` }}
        onClick={onClick}
      >
        <CardContent className="p-4">
          <div className="flex justify-between items-start">
            <div className="flex-1 min-w-0">
                {/* ... (keep existing community/author info) ... */}
                {showCommunity && post.community && ( <div className="mb-2 flex items-center space-x-1.5 flex-wrap"> {post.community.icon && <span className="text-sm">{post.community.icon}</span>} <button className="text-xs font-medium text-gray-600 dark:text-gray-400 hover:underline focus:outline-none" onClick={(e) => { e.stopPropagation(); navigate(`/communities/${post.community?.slug || post.community?.id}`);}}> {post.community.name} </button> <span className="text-xs text-gray-400 dark:text-gray-500">•</span> <span className="text-xs text-gray-500 dark:text-gray-400">Posted by u/{authorDisplay}</span> <span className="text-xs text-gray-400 dark:text-gray-500">•</span> <span className="text-xs text-gray-500 dark:text-gray-400">{formatTimeAgo(post.createdAt)}</span> </div> )}
                {!showCommunity && ( <div className="flex items-center space-x-3 mb-2"> <Avatar className="h-6 w-6"><AvatarImage src={post.author.avatarUrl} alt={post.author.name}/><AvatarFallback>{post.author.name?.split(' ').map(n => n[0]).join('').toUpperCase() || 'U'}</AvatarFallback></Avatar> <div> <p className="text-xs font-medium text-gray-700 dark:text-gray-300">u/{authorDisplay}</p> <p className="text-xs text-gray-500 dark:text-gray-400">{formatTimeAgo(post.createdAt)}</p> </div> </div> )}
                <h3 className="font-semibold text-lg text-gray-900 dark:text-white mb-1 hover:text-unicampus-red" onClick={onClick}>{post.title}</h3>
            </div>
            
            {isAuthor && (
                <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon" className="h-7 w-7 flex-shrink-0 ml-2" onClick={e => e.stopPropagation()}>
                            <MoreHorizontal className="h-4 w-4" /> <span className="sr-only">Post options</span>
                        </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end" onClick={e => e.stopPropagation()}>
                        {/* --- ADD EDIT MENU ITEM --- */}
                        <DropdownMenuItem onClick={handleEditPostTrigger}>
                            <Edit className="mr-2 h-4 w-4" /> Edit Post
                        </DropdownMenuItem>
                        {/* <DropdownMenuSeparator />  // Optional: Add a separator */}
                        {/* --- END EDIT --- */}
                        <DropdownMenuItem onClick={handleDeletePostTrigger} className="text-red-600 focus:text-red-600 focus:bg-red-50 dark:focus:bg-red-900/50">
                            <Trash2 className="mr-2 h-4 w-4" /> Delete Post
                        </DropdownMenuItem>
                    </DropdownMenuContent>
                </DropdownMenu>
            )}
          </div>
          
          {/* ... (keep existing post content display: text, image, link, tags) ... */}
          {post.contentType === 'text' && displayedContent && (<p className="text-sm text-gray-700 dark:text-gray-300 line-clamp-4 my-2">{displayedContent}</p>)}
          {post.contentType === 'image' && post.imageUrl && (<div className="my-2 rounded-lg overflow-hidden max-h-96 flex justify-center bg-gray-100 dark:bg-gray-700"><img src={post.imageUrl} alt="Post image" className="max-h-96 object-contain" /></div>)}
          {post.contentType === 'link' && post.linkUrl && (<a href={post.linkUrl} target="_blank" rel="noopener noreferrer" onClick={(e) => e.stopPropagation()} className="my-2 p-3 border dark:border-gray-700 rounded-md flex items-center space-x-2 text-sm text-blue-600 dark:text-blue-400 hover:bg-gray-50 dark:hover:bg-gray-700"><ExternalLink className="h-4 w-4 flex-shrink-0" /><span className="truncate flex-grow">{post.linkUrl}</span></a>)}
          {post.tags && post.tags.length > 0 && (<div className="my-2 flex flex-wrap gap-1">{post.tags.map(tag => (<Badge key={tag} variant="secondary" className="text-xs">{tag}</Badge>))}</div>)}


          <div className="flex items-center justify-start space-x-4 mt-2">
            {/* ... (keep existing vote and comment buttons) ... */}
            <div className="flex items-center space-x-0.5">
                <Button variant="ghost" size="sm" className={`p-1 h-8 w-8 rounded-full ${userVote === 'up' ? 'text-unicampus-red bg-unicampus-red/10' : 'text-gray-500 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-700'}`} onClick={(e) => handleVote('up', e)} disabled={isVoting}> <ChevronUp className="h-5 w-5" /> </Button>
                <span className="text-sm font-medium text-gray-700 dark:text-gray-300 min-w-[2.5rem] text-center tabular-nums">{score}</span>
                <Button variant="ghost" size="sm" className={`p-1 h-8 w-8 rounded-full ${userVote === 'down' ? 'text-blue-600 bg-blue-600/10' : 'text-gray-500 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-700'}`} onClick={(e) => handleVote('down', e)} disabled={isVoting}> <ChevronDown className="h-5 w-5" /> </Button>
            </div>
            <Button variant="ghost" size="sm" className="flex items-center space-x-1.5 text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300" onClick={onClick}>
                <MessageSquare className="h-4 w-4" /> <span className="text-sm">{post.commentCount}</span>
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* ... (keep existing AlertDialog for delete confirmation) ... */}
      <AlertDialog open={showDeleteConfirm} onOpenChange={setShowDeleteConfirm}>
        <AlertDialogContent onClick={e => e.stopPropagation()}>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
            <AlertDialogDescription>This action cannot be undone. This will permanently delete the post "{post.title}".</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDeletePostConfirm} disabled={isDeleting} className="bg-red-600 hover:bg-red-700 dark:bg-red-700 dark:hover:bg-red-800 text-white">
                {isDeleting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />} Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
};

export default PostListItem;