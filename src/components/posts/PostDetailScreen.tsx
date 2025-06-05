// src/components/posts/PostDetailScreen.tsx
import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useParams, useNavigate, Link as RouterLink } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { 
    ChevronLeft, Loader2, MessageSquare, ChevronUp, ChevronDown, 
    ExternalLink, Send, UserCircle, CornerDownRight, MoreHorizontal, Trash2,
    Edit // <<< --- ADD THIS ICON
} from 'lucide-react';
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, 
  // DropdownMenuSeparator, // <<< --- OPTIONAL
  DropdownMenuTrigger
} from "@/components/ui/dropdown-menu";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { useAuth } from '@/contexts/AuthContext';
import apiClient, { PaginatedResponse } from '@/lib/apiClient';
import { toast } from '@/hooks/use-toast';
import { 
    Post, Comment, Author as PostAuthor, PostDetailApiResponse, 
    CreateCommentApiResponse, VoteApiResponse, DeleteApiResponse
} from '@/types/community';
import { formatTimeAgo, formatAuthorDisplay } from '@/lib/utils';

// --- Normalization functions (keep as is) ---
const normalizePostData = (apiPost: any): Post => { /* ... */ 
    const id = apiPost.id || apiPost._id; if(!id) { return { ...apiPost, id: `fallback-post-${Math.random()}`, title: "Error: Post incomplete" } as Post; }
    return { id:id, _id:apiPost._id||id, title:apiPost.title||"Untitled Post", contentType:apiPost.contentType||apiPost.content_type||'text', contentText:apiPost.contentText||apiPost.content_text||apiPost.contentPreview, contentPreview:apiPost.contentPreview||apiPost.content_text||apiPost.contentText, imageUrl:apiPost.imageUrl||apiPost.image_url, linkUrl:apiPost.linkUrl||apiPost.link_url, tags:apiPost.tags||[], author:normalizeAuthorData(apiPost.author), communityId:apiPost.communityId||apiPost.community?.id, communityName:apiPost.communityName||apiPost.community?.name, communitySlug:apiPost.communitySlug||apiPost.community?.slug, communityIcon:apiPost.communityIcon||apiPost.community?.icon, community:apiPost.community, createdAt:apiPost.createdAt||apiPost.created_at||new Date().toISOString(), updatedAt:apiPost.updatedAt||apiPost.updated_at, lastActivityAt:apiPost.lastActivityAt||apiPost.last_activity_at, upvotes:apiPost.upvotes??0, downvotes:apiPost.downvotes??0, commentCount:apiPost.commentCount??apiPost.comment_count??0, userVote:apiPost.userVote||apiPost.user_vote||null };
};
const normalizeAuthorData = (apiAuthor: any): PostAuthor => { /* ... */ 
    if (!apiAuthor) return { id: 'unknown', name: 'Unknown Author', usn: 'N/A', avatarUrl: undefined };
    return { id: apiAuthor.id || apiAuthor._id || 'unknown', name: apiAuthor.name || 'Unknown Author', usn: apiAuthor.usn, avatarUrl: apiAuthor.avatarUrl || apiAuthor.avatar };
};
const normalizeCommentData = (apiComment: any): Comment => { /* ... */ 
    const id = apiComment.id || apiComment._id; if (!id) { return { ...apiComment, id: `fallback-comment-${Math.random()}`, text: "Error: Comment incomplete" } as Comment; }
    return { id:id, _id:apiComment._id||id, postId:apiComment.postId||apiComment.post_id, author:normalizeAuthorData(apiComment.author), text:apiComment.text||"", parentId:apiComment.parentId||apiComment.parent_id, replyCount:apiComment.replyCount??apiComment.reply_count??0, upvotes:apiComment.upvotes??0, downvotes:apiComment.downvotes??0, createdAt:apiComment.createdAt||apiComment.created_at||new Date().toISOString(), updatedAt:apiComment.updatedAt||apiComment.updated_at, userVote:apiComment.userVote||apiComment.user_vote||null };
};


// --- CommentListItem Component (keep as is, already has temporary edit logic) ---
interface CommentListItemProps { /* ... */ }
const CommentListItem: React.FC<CommentListItemProps> = ({ comment, onReply, onDeleteComment }) => { /* ... */ 
    const { user, isAuthenticated } = useAuth();
    const authorDisplay = formatAuthorDisplay(comment.author);
    const isCommentAuthor = true; 
    const [showDeleteCommentConfirm, setShowDeleteCommentConfirm] = useState(false);
    const [isDeletingComment, setIsDeletingComment] = useState(false);

    const handleDeleteCommentTrigger = (e: MouseEvent) => { e.stopPropagation(); setShowDeleteCommentConfirm(true); };
    const handleDeleteCommentConfirm = async (e?: MouseEvent) => {
        e?.stopPropagation(); setShowDeleteCommentConfirm(false);
        setIsDeletingComment(true);
        try {
            await new Promise(resolve => setTimeout(resolve, 700));
            toast({ title: "Comment Deleted (Mock)" });
            onDeleteComment(comment.id);
        } catch (error: any) { toast({ title: "Error Deleting Comment", description: error.message, variant: "destructive" });
        } finally { setIsDeletingComment(false); }
    };
    // --- NEW: Edit comment trigger (mock) ---
    const handleEditCommentTrigger = (e: MouseEvent) => {
      e.stopPropagation();
      toast({ title: "Edit Comment (Mock)", description: "Edit comment functionality to be implemented." });
      // Potentially: onEditComment(comment.id) to pass to parent
    };

    return (
        <>
            <div className="flex space-x-3 py-3 border-b border-gray-200 dark:border-gray-700 last:border-b-0">
                <Avatar className="h-8 w-8 flex-shrink-0 mt-1"> <AvatarImage src={comment.author.avatarUrl} alt={comment.author.name} /> <AvatarFallback>{comment.author.name?.charAt(0).toUpperCase() || <UserCircle size={20}/>}</AvatarFallback> </Avatar>
                <div className="flex-1 min-w-0">
                    <div className="flex justify-between items-start">
                        <div>
                            <div className="flex items-center space-x-2 text-xs mb-0.5"> <span className="font-semibold text-gray-800 dark:text-gray-200">{authorDisplay}</span> <span className="text-gray-500 dark:text-gray-400">• {formatTimeAgo(comment.createdAt)}</span> </div>
                            <p className="text-sm text-gray-700 dark:text-gray-300 whitespace-pre-wrap break-words">{comment.text}</p>
                        </div>
                        {isCommentAuthor && ( <DropdownMenu> 
                            <DropdownMenuTrigger onClick={e => e.stopPropagation()} className="p-1 h-7 w-7 flex items-center justify-center rounded-md hover:bg-gray-100 dark:hover:bg-gray-700 data-[state=open]:bg-gray-100 dark:data-[state=open]:bg-gray-700 flex-shrink-0 -mr-2" aria-label="Comment options"> 
                                <MoreHorizontal className="h-4 w-4 text-gray-600 dark:text-gray-400" /> 
                            </DropdownMenuTrigger> 
                            <DropdownMenuContent align="end" onClick={e => e.stopPropagation()}> 
                                {/* --- ADD EDIT COMMENT ITEM --- */}
                                <DropdownMenuItem onClick={handleEditCommentTrigger}>
                                    <Edit className="mr-2 h-4 w-4" /> Edit
                                </DropdownMenuItem>
                                {/* <DropdownMenuSeparator /> */}
                                {/* --- END EDIT --- */}
                                <DropdownMenuItem onClick={handleDeleteCommentTrigger} className="text-red-600 focus:text-red-600 focus:bg-red-50 dark:focus:bg-red-900/50"> <Trash2 className="mr-2 h-4 w-4" /> Delete </DropdownMenuItem> 
                            </DropdownMenuContent> </DropdownMenu> )}
                    </div>
                    <div className="flex items-center space-x-3 mt-1.5 text-xs"> <Button variant="ghost" size="xs" className="p-1 h-auto text-gray-500 dark:text-gray-400 hover:text-unicampus-red dark:hover:text-unicampus-red"  onClick={(e) => {e.stopPropagation(); onReply(comment.id, comment.author.name);}}> <CornerDownRight className="h-3.5 w-3.5 mr-1" /> Reply ({comment.replyCount ?? 0}) </Button> </div>
                </div>
            </div>
            <AlertDialog open={showDeleteCommentConfirm} onOpenChange={setShowDeleteCommentConfirm}> <AlertDialogContent onClick={e => e.stopPropagation()}> <AlertDialogHeader><AlertDialogTitle>Delete Comment?</AlertDialogTitle> <AlertDialogDescription>This action cannot be undone. This will permanently delete this comment.</AlertDialogDescription> </AlertDialogHeader> <AlertDialogFooter> <AlertDialogCancel>Cancel</AlertDialogCancel> <AlertDialogAction onClick={handleDeleteCommentConfirm} disabled={isDeletingComment} className="bg-red-600 hover:bg-red-700 text-white"> {isDeletingComment && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}Delete </AlertDialogAction> </AlertDialogFooter> </AlertDialogContent> </AlertDialog>
        </>
    );
};


// --- PostDetailScreen Component ---
const PostDetailScreen = () => {
  // ... (keep existing state and functions: fetchPostDetail, fetchComments, handlePostVote, handleCommentSubmit, handleSetReplyTo, handleDeletePost, handleDeleteComment) ...
  const { postId } = useParams<{ postId: string }>();
  const navigate = useNavigate();
  const { user, isAuthenticated, isLoading: authIsLoading } = useAuth();
  const [post, setPost] = useState<Post | null>(null);
  const [comments, setComments] = useState<Comment[]>([]);
  const [isLoadingPost, setIsLoadingPost] = useState(true);
  const [isLoadingComments, setIsLoadingComments] = useState(true);
  const [isVotingPost, setIsVotingPost] = useState(false);
  const [newCommentText, setNewCommentText] = useState("");
  const [isSubmittingComment, setIsSubmittingComment] = useState(false);
  const [replyingTo, setReplyingTo] = useState<{ commentId: string; authorName: string } | null>(null);
  const commentInputRef = useRef<HTMLTextAreaElement>(null);
  const [currentCommentsPage, setCurrentCommentsPage] = useState(1);
  const [totalCommentsPages, setTotalCommentsPages] = useState(1);
  const [showDeletePostConfirm, setShowDeletePostConfirm] = useState(false);
  const [isDeletingPost, setIsDeletingPost] = useState(false);
  const [fetchError, setFetchError] = useState<string | null>(null);

  const fetchPostDetail = useCallback(async () => { 
    if (!postId) { setFetchError("Post ID missing."); setIsLoadingPost(false); navigate(-1); return; }
    setIsLoadingPost(true); setFetchError(null);
    try { const response = await apiClient<PostDetailApiResponse>(`/posts/${postId}`);
      if (response.status === 'success' && response.data?.post) { setPost(normalizePostData(response.data.post)); }
      else { const errorMsg = (response as any).message || "Post not found."; toast({ title: "Error", description: errorMsg, variant: "destructive" }); setFetchError(errorMsg); }
    } catch (error: any) { const errorMsg = error.message || "Failed to load post."; toast({ title: "Error", description: errorMsg, variant: "destructive" }); setFetchError(errorMsg);
    } finally { setIsLoadingPost(false); }
  }, [postId, navigate]);
  const fetchComments = useCallback(async (page = 1) => { 
    if (!postId) return;
    if (page === 1) setIsLoadingComments(true); else setIsLoadingComments(false); // Corrected logic
    const params = new URLSearchParams({ page: page.toString(), limit: '10', sortBy: 'newest' });
    try { const response = await apiClient<PaginatedResponse<any>>(`/posts/${postId}/comments?${params.toString()}`);
      if (response.status === 'success' && Array.isArray(response.data)) {
        const normalized = response.data.map(normalizeCommentData);
        setComments(prev => page === 1 ? normalized : [...prev, ...normalized]);
        const itemsPerPage = 10;
        setTotalCommentsPages(response.results ? Math.ceil(response.results / itemsPerPage) : page + (response.data.length < itemsPerPage ? 0 : 1));
        setCurrentCommentsPage(page);
      } else if (page === 1) setComments([]);
    } catch (error: any) { if (page === 1) setComments([]); } 
    finally { setIsLoadingComments(false); } // Always set to false
  }, [postId]);
  useEffect(() => { if (!authIsLoading && postId) { fetchPostDetail(); fetchComments(1); } else if (!postId && !authIsLoading) { setIsLoadingPost(false); setIsLoadingComments(false); setFetchError("Post ID not available."); } }, [postId, authIsLoading, fetchPostDetail, fetchComments]);
  const handlePostVote = async (voteDirectionAttempt: 'up' | 'down') => { 
    if (!isAuthenticated || !post) { toast({ title: "Login Required", description: "Please log in to vote.", variant: "destructive" }); if(!isAuthenticated) navigate('/login/student'); return; }
    if (isVotingPost) return; setIsVotingPost(true);
    const originalUserVote = post.userVote, originalUpvotes = post.upvotes, originalDownvotes = post.downvotes;
    let newApiDirection: 'up' | 'down' | 'none' = post.userVote === voteDirectionAttempt ? 'none' : voteDirectionAttempt;
    const tempPost = { ...post };
    if (newApiDirection === 'none') { if (originalUserVote === 'up') tempPost.upvotes--; else if (originalUserVote === 'down') tempPost.downvotes--; tempPost.userVote = null; }
    else { if (originalUserVote === 'up') tempPost.upvotes--; else if (originalUserVote === 'down') tempPost.downvotes--;
           if (newApiDirection === 'up') tempPost.upvotes++; else tempPost.downvotes++; tempPost.userVote = newApiDirection; }
    setPost(tempPost);
    try { const response = await apiClient<VoteApiResponse>(`/posts/${post.id}/vote`, { method: 'POST', data: { direction: newApiDirection } });
        if (response.status === 'success' && response.data) { setPost(p => p ? { ...p, upvotes: response.data.upvotes, downvotes: response.data.downvotes, userVote: response.data.user_vote } : null); } 
        else throw new Error((response as any).message || "Vote failed.");
    } catch (error: any) { toast({ title: "Vote Error", description: error.message, variant: "destructive" }); setPost(p => p ? {...p, userVote: originalUserVote, upvotes: originalUpvotes, downvotes: originalDownvotes } : null);
    } finally { setIsVotingPost(false); }
  };
  const handleCommentSubmit = async (e: React.FormEvent) => { 
    e.preventDefault();
    if (!newCommentText.trim() || !postId || !isAuthenticated) { toast({ title: "Cannot Comment", description: !isAuthenticated ? "Please log in." : "Comment cannot be empty.", variant: "destructive"}); if (!isAuthenticated) navigate('/login/student'); return; }
    setIsSubmittingComment(true);
    try { const payload: { text: string; parent_comment_id?: string } = { text: newCommentText.trim() }; if (replyingTo) payload.parent_comment_id = replyingTo.commentId;
        const response = await apiClient<CreateCommentApiResponse>(`/posts/${postId}/comments`, { method: 'POST', data: payload });
        if (response.status === 'success' && response.data?.comment) {
            const newComment = normalizeCommentData(response.data.comment);
            if (replyingTo) { setComments(prev => prev.map(c => c.id === replyingTo?.commentId ? {...c, replyCount: (c.replyCount || 0) + 1} : c)); fetchComments(1); } // Re-fetch to get nested replies correctly sorted, or handle complex local update
            else { setComments(prev => [newComment, ...prev]); }
            setPost(p => p ? {...p, commentCount: (p.commentCount || 0) + 1} : null);
            setNewCommentText(""); setReplyingTo(null); toast({ title: "Comment Posted!" });
        } else throw new Error((response as any).message || "Failed to post comment.");
    } catch (error: any) { toast({ title: "Comment Error", description: error.message, variant: "destructive"});
    } finally { setIsSubmittingComment(false); }
  };
  const handleSetReplyTo = (commentId: string, authorName: string) => { 
    setReplyingTo({ commentId, authorName }); commentInputRef.current?.focus(); commentInputRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' });
  };
  const handleDeletePost = async () => { 
    setShowDeletePostConfirm(false); if (!post) return; setIsDeletingPost(true);
    try { await new Promise(resolve => setTimeout(resolve, 1000)); toast({ title: "Post Deleted (Mock)", description: `"${post.title}" has been removed.` }); navigate(`/communities/${post.communityId || post.community?.id || ''}`, { replace: true });
    } catch (error: any) { toast({ title: "Error Deleting Post", description: error.message, variant: "destructive" });
    } finally { setIsDeletingPost(false); }
  };
  const handleDeleteComment = (commentId: string) => { 
    const originalComments = [...comments]; setComments(prevComments => prevComments.filter(c => c.id !== commentId));
    if (post) setPost(p => p ? {...p, commentCount: Math.max(0, (p.commentCount || 0) - 1)} : null);
    // Simulate API delay for mock
    new Promise<void>(resolve => setTimeout(resolve, 700)).then(() => toast({ title: "Comment Deleted (Mock)" }))
        .catch((error: any) => { toast({ title: "Error Deleting Comment", description: error.message, variant: "destructive" }); setComments(originalComments); if (post) setPost(p => p ? {...p, commentCount: (p.commentCount || 0) + 1} : null); });
  };
  // --- NEW: Handle Edit Post Trigger (for PostDetailScreen) ---
  const handleEditPostTrigger = () => {
    if (!post) return;
    // When real auth is back, uncomment:
    // if (!isPostAuthor) { 
    //     toast({ title: "Unauthorized", description: "You cannot edit this post.", variant: "destructive" });
    //     return;
    // }
    toast({ title: "Edit Post (Mock)", description: `Edit action triggered for "${post.title}". Implement navigation to an edit page or modal.` });
    // Example: navigate(`/posts/${post.id}/edit`); 
  };
  // --- END NEW ---


  if (authIsLoading || (isLoadingPost && !fetchError && !post) ) { return <div className="flex items-center justify-center min-h-screen"><Loader2 className="h-8 w-8 animate-spin text-unicampus-red" /> Loading Post...</div>; }
  if (fetchError && !post) { return <div className="flex flex-col items-center justify-center min-h-screen p-4 text-center">Error: {fetchError} <Button variant="link" className="mt-4" onClick={() => navigate('/communities')}>Go to Communities</Button></div>; }
  if (!post) { return <div className="flex flex-col items-center justify-center min-h-screen p-4 text-center">Post not found or unable to load. <Button variant="link" className="mt-4" onClick={() => navigate('/communities')}>Go to Communities</Button></div>; }

  const score = (post.upvotes ?? 0) - (post.downvotes ?? 0);
  const postAuthorDisplay = formatAuthorDisplay(post.author);
  // const isPostAuthor = isAuthenticated && user && post.author && user.id === post.author.id; // Original check
  const isPostAuthor = true; // TEMPORARY FOR UI TESTING

  return (
    <div className="min-h-screen bg-gray-100 dark:bg-gray-950 pb-16">
      <div className="bg-white dark:bg-gray-900 shadow-sm px-2 py-3 sticky top-0 z-30">
        <div className="max-w-3xl mx-auto flex items-center space-x-2">
          <Button variant="ghost" size="icon" onClick={() => navigate(-1)} title="Go Back"> <ChevronLeft className="h-6 w-6" /> </Button>
          <h1 className="text-lg font-semibold text-gray-900 dark:text-white truncate flex-1">{post.title}</h1>
          {isPostAuthor && (
            <DropdownMenu>
                <DropdownMenuTrigger 
                    onClick={e => e.stopPropagation()}
                    className="p-1 h-8 w-8 flex items-center justify-center rounded-md hover:bg-gray-100 dark:hover:bg-gray-700 data-[state=open]:bg-gray-100 dark:data-[state=open]:bg-gray-700 flex-shrink-0"
                    aria-label="Post options"
                > 
                    <MoreHorizontal className="h-4 w-4 text-gray-600 dark:text-gray-400" /> 
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" onClick={e => e.stopPropagation()}>
                    {/* --- ADD EDIT MENU ITEM --- */}
                    <DropdownMenuItem onClick={handleEditPostTrigger}>
                        <Edit className="mr-2 h-4 w-4" /> Edit Post
                    </DropdownMenuItem>
                    {/* <DropdownMenuSeparator /> */}
                    {/* --- END EDIT --- */}
                    <DropdownMenuItem onClick={() => setShowDeletePostConfirm(true)} className="text-red-600 focus:text-red-600 focus:bg-red-50 dark:focus:bg-red-900/50">
                        <Trash2 className="mr-2 h-4 w-4" /> Delete Post
                    </DropdownMenuItem>
                </DropdownMenuContent>
            </DropdownMenu>
          )}
        </div>
      </div>

      <div className="max-w-3xl mx-auto p-0 sm:p-4">
        {/* ... (keep existing Main Post Card JSX) ... */}
        <Card className="dark:bg-gray-800 dark:border-gray-700 shadow-none sm:shadow-md sm:rounded-lg">
           <CardHeader className="p-4 md:p-6 border-b dark:border-gray-700"> {post.community && ( <div className="mb-2 flex items-center space-x-1.5 flex-wrap"> {post.community.icon && <span className="text-base">{post.community.icon}</span>} <RouterLink to={`/communities/${post.community.slug || post.community.id}`} className="text-xs font-semibold text-gray-700 dark:text-gray-300 hover:underline"> c/{post.community.name} </RouterLink> <span className="text-xs text-gray-400 dark:text-gray-500">•</span> <span className="text-xs text-gray-500 dark:text-gray-400">Posted by u/{postAuthorDisplay}</span> <span className="text-xs text-gray-400 dark:text-gray-500">•</span> <span className="text-xs text-gray-500 dark:text-gray-400">{formatTimeAgo(post.createdAt)}</span> </div> )} <CardTitle className="text-xl md:text-2xl font-bold text-gray-900 dark:text-white">{post.title}</CardTitle> {post.tags && post.tags.length > 0 && ( <div className="mt-2 flex flex-wrap gap-1.5"> {post.tags.map(tag => <Badge key={tag} variant="secondary" className="text-xs">{tag}</Badge>)} </div> )} </CardHeader>
           <CardContent className="p-4 md:p-6 text-sm text-gray-800 dark:text-gray-200 leading-relaxed"> {post.contentType === 'text' && post.contentText && <div className="whitespace-pre-wrap break-words">{post.contentText}</div>} {post.contentType === 'image' && post.imageUrl && ( <img src={post.imageUrl} alt={post.title} className="rounded-md max-h-[70vh] w-auto mx-auto my-2" /> )} {post.contentType === 'link' && post.linkUrl && ( <a href={post.linkUrl} target="_blank" rel="noopener noreferrer" className="flex items-center space-x-2 text-blue-600 dark:text-blue-400 hover:underline break-all"> <ExternalLink className="h-4 w-4 flex-shrink-0" /> <span>{post.linkUrl}</span> </a> )} </CardContent>
           <CardFooter className="p-4 md:p-6 border-t dark:border-gray-700 flex items-center justify-start space-x-4"> <div className="flex items-center space-x-0.5"> <Button variant="ghost" size="sm" className={`p-1 h-8 w-8 rounded-full ${post.userVote === 'up' ? 'text-unicampus-red bg-unicampus-red/10' : 'text-gray-500 hover:bg-gray-200 dark:text-gray-400 dark:hover:bg-gray-700'}`} onClick={() => handlePostVote('up')} disabled={isVotingPost}><ChevronUp className="h-5 w-5" /></Button> <span className="text-sm font-bold text-gray-700 dark:text-gray-300 min-w-[2.5rem] text-center tabular-nums">{score}</span> <Button variant="ghost" size="sm" className={`p-1 h-8 w-8 rounded-full ${post.userVote === 'down' ? 'text-blue-600 bg-blue-600/10' : 'text-gray-500 hover:bg-gray-200 dark:text-gray-400 dark:hover:bg-gray-700'}`} onClick={() => handlePostVote('down')} disabled={isVotingPost}><ChevronDown className="h-5 w-5" /></Button> </div> <div className="flex items-center space-x-1.5 text-gray-500 dark:text-gray-400"> <MessageSquare className="h-4 w-4" /> <span className="text-sm">{post.commentCount} Comments</span> </div> </CardFooter>
        </Card>

        {/* ... (keep existing Comments Card JSX) ... */}
        <Card className="mt-4 dark:bg-gray-800 dark:border-gray-700 shadow-none sm:shadow-md sm:rounded-lg">
          <CardHeader className="p-4 md:p-6 border-b dark:border-gray-700"> <CardTitle className="text-lg font-semibold text-gray-800 dark:text-gray-200"> {isLoadingComments && comments.length === 0 ? 'Loading Comments...' : `${post.commentCount} ${post.commentCount === 1 ? 'Comment' : 'Comments'}`} </CardTitle> </CardHeader>
          <CardContent className="p-4 md:p-6 pt-0">
            {isAuthenticated && ( <form onSubmit={handleCommentSubmit} className="mb-6 pt-2"> {replyingTo && (<div className="text-xs text-gray-600 dark:text-gray-400 mb-1 flex justify-between items-center"><span>Replying to <span className="font-semibold">{replyingTo.authorName}</span></span><Button variant="link" size="xs" className="p-0 h-auto text-unicampus-red hover:text-unicampus-red-dark" type="button" onClick={() => setReplyingTo(null)}>Cancel</Button></div>)} <Textarea ref={commentInputRef} value={newCommentText} onChange={(e) => setNewCommentText(e.target.value)} placeholder={replyingTo ? `Your reply to ${replyingTo.authorName}...` : "Share your thoughts..."} rows={replyingTo ? 2 : 3} className="w-full mb-2 dark:bg-gray-700 dark:border-gray-600 dark:text-white focus:ring-unicampus-red"/> <div className="flex justify-end"><Button type="submit" size="sm" className="bg-unicampus-red hover:bg-unicampus-red-dark text-white" disabled={isSubmittingComment || !newCommentText.trim()}> {isSubmittingComment ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Send className="h-4 w-4 mr-2" />} {replyingTo ? "Post Reply" : "Post Comment"} </Button></div> </form> )}
            {!isAuthenticated && ( <div className="py-4 text-center text-sm text-gray-600 dark:text-gray-400"><RouterLink to="/login/student" className="text-unicampus-red hover:underline font-semibold">Log in</RouterLink> or <RouterLink to="/register" className="text-unicampus-red hover:underline font-semibold">sign up</RouterLink> to leave a comment.</div> )}
            {isLoadingComments && comments.length === 0 ? ( <div className="text-center py-6 text-gray-500 dark:text-gray-400">Loading comments...</div> ) 
            : comments.length > 0 ? ( <div className="space-y-1 divide-y divide-gray-200 dark:divide-gray-700"> {comments.map(comment => ( <CommentListItem key={comment.id} comment={comment} onReply={handleSetReplyTo} onDeleteComment={handleDeleteComment} /> ))} {!isLoadingComments && currentCommentsPage < totalCommentsPages && comments.length > 0 && (<div className="text-center pt-4"><Button variant="outline" size="sm" onClick={() => fetchComments(currentCommentsPage + 1)} disabled={isLoadingComments}>Load More Comments</Button></div>)} </div> ) 
            : ( <p className="text-center text-gray-500 dark:text-gray-400 py-6">No comments yet. Be the first to comment!</p> )}
          </CardContent>
        </Card>
      </div>
      
      {/* ... (keep existing AlertDialog for post delete confirmation) ... */}
      <AlertDialog open={showDeletePostConfirm} onOpenChange={setShowDeletePostConfirm}> <AlertDialogContent> <AlertDialogHeader><AlertDialogTitle>Delete Post?</AlertDialogTitle> <AlertDialogDescription>This action cannot be undone. This will permanently delete this post and all its comments.</AlertDialogDescription> </AlertDialogHeader> <AlertDialogFooter> <AlertDialogCancel>Cancel</AlertDialogCancel> <AlertDialogAction onClick={handleDeletePost} disabled={isDeletingPost} className="bg-red-600 hover:bg-red-700 text-white"> {isDeletingPost && <Loader2 className="mr-2 h-4 w-4 animate-spin"/>}Delete Post </AlertDialogAction> </AlertDialogFooter> </AlertDialogContent> </AlertDialog>
    </div>
  );
};

export default PostDetailScreen;