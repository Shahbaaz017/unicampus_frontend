// src/components/communities/CommunityDetailScreen.tsx
import React, { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import BottomNavigation from '@/components/layout/BottomNavigation';
import PostListItem from './PostListItem';
import CreatePostScreen from './CreatePostScreen';
import { ChevronLeft, Users, MessageSquare, Loader2, Edit3, Edit as EditIcon } from 'lucide-react'; // <<<--- ADDED EditIcon
import { useAuth } from '@/contexts/AuthContext';
import apiClient, { PaginatedResponse } from '@/lib/apiClient';
import { toast } from '@/hooks/use-toast';
import { CommunityDetail, Post, CommunityDetailApiResponse, JoinLeaveApiResponse, VoteApiResponse, Author as PostAuthor } from '@/types/community';

// Helper to normalize community data from API (handles snake_case and defaults)
const normalizeCommunityData = (apiCommunity: any): CommunityDetail => {
    const id = apiCommunity.id || apiCommunity._id;
    if (!id) {
        console.error("Normalization Error: Community data missing ID", apiCommunity);
        throw new Error("Community data from API is missing a valid ID.");
    }
    return {
        id: id,
        _id: apiCommunity._id || id,
        name: apiCommunity.name || "Unnamed Community",
        description: apiCommunity.description || "",
        slug: apiCommunity.slug,
        icon: apiCommunity.icon_url || apiCommunity.icon,
        bannerImage: apiCommunity.banner_image_url || apiCommunity.bannerImage,
        memberCount: apiCommunity.member_count ?? apiCommunity.memberCount ?? 0,
        postCount: apiCommunity.post_count ?? apiCommunity.postCount ?? 0,
        is_member: apiCommunity.is_member ?? false,
        tags: apiCommunity.tags || [],
        rules: apiCommunity.rules || [],
        createdAt: apiCommunity.created_at || apiCommunity.createdAt,
        updatedAt: apiCommunity.updated_at || apiCommunity.updatedAt,
        // --- Ensure createdBy or similar field is normalized if it exists from API ---
        // Example: createdBy: apiCommunity.created_by || apiCommunity.createdBy, // This field is needed for ownership
    };
};

// Helper to normalize post data
const normalizePostData = (apiPost: any): Post => {
    const id = apiPost.id || apiPost._id;
    if(!id) throw new Error("Post data from API is missing valid ID.");
    return {
        id: id,
        _id: apiPost._id || id,
        title: apiPost.title || "Untitled Post",
        contentType: apiPost.content_type || 'text',
        contentText: apiPost.content_text || apiPost.contentPreview,
        contentPreview: apiPost.contentPreview || apiPost.content_text,
        imageUrl: apiPost.image_url,
        linkUrl: apiPost.link_url,
        tags: apiPost.tags || [],
        author: apiPost.author || { id: 'unknown', name: 'Unknown Author' },
        communityId: apiPost.communityId || apiPost.community?.id,
        community: apiPost.community,
        createdAt: apiPost.created_at || apiPost.createdAt || new Date().toISOString(),
        updatedAt: apiPost.updated_at || apiPost.updatedAt,
        upvotes: apiPost.upvotes ?? 0,
        downvotes: apiPost.downvotes ?? 0,
        commentCount: apiPost.comment_count ?? apiPost.commentCount ?? 0,
        userVote: apiPost.user_vote || null,
    };
};


const CommunityDetailScreen = () => {
  const { communityId: communityIdOrSlug } = useParams<{ communityId: string }>();
  const navigate = useNavigate();
  const { isAuthenticated, isLoading: authIsLoading, user } = useAuth(); // <<<--- ADDED user

  const [community, setCommunity] = useState<CommunityDetail | null>(null);
  const [posts, setPosts] = useState<Post[]>([]);
  const [isLoadingCommunity, setIsLoadingCommunity] = useState(true);
  const [isLoadingPosts, setIsLoadingPosts] = useState(true);
  const [isCreatePostOpen, setIsCreatePostOpen] = useState(false);
  const [isProcessingJoinLeave, setIsProcessingJoinLeave] = useState(false);

  const [currentPostsPage, setCurrentPostsPage] = useState(1);
  const [totalPostsPages, setTotalPostsPages] = useState(1);
  const [sortBy, setSortBy] = useState<'new' | 'hot' | 'top'>('new');

  // --- Ownership Check Logic ---
  // const isOwnerRealCheck = isAuthenticated && user && community && community.createdBy && user.id === community.createdBy;
  // For UI testing:
  const isOwner = true; // TEMPORARY: Set to true to always show the button for UI testing
                        // Replace with 'isOwnerRealCheck' when backend is ready
                        // Make sure your `CommunityDetail` type has `createdBy` (or similar) and it's populated.
                        // Also ensure `user.id` from `useAuth` is the correct field for comparison.
  // -----------------------------

  // --- Handler for Edit Community Button ---
  const handleEditCommunity = () => {
    if (!community) return;
    // When real auth is back, re-check ownership if needed, though button visibility handles it.
    // if (!isOwner) {
    //   toast({ title: "Permission Denied", description: "You cannot edit this community.", variant: "destructive"});
    //   return;
    // }
    toast({
        title: "Edit Community (Mock)",
        description: `Update action triggered for "${community.name}". Navigation or modal to edit form would go here.`
    });
    // Example: navigate(`/communities/${community.id}/edit`);
  };
  // ---------------------------------------


  const fetchCommunityDetails = useCallback(async () => {
    // ... (keep existing fetchCommunityDetails logic)
    if (!communityIdOrSlug) {
        toast({ title: "Navigation Error", description: "Community identifier is missing.", variant: "destructive" });
        navigate('/communities', { replace: true });
        return;
    }
    setIsLoadingCommunity(true);
    try {
      const response = await apiClient<{ status: string; data: { community: any } }>(`/communities/${communityIdOrSlug}`);
      const rawCommunityData = response.data?.community;
      if (response.status === 'success' && rawCommunityData) {
        const normalizedCommunity = normalizeCommunityData(rawCommunityData);
        setCommunity(normalizedCommunity);
      } else {
        console.warn("Community detail fetch: Success status but data.community or critical fields missing. Full Response:", response);
        toast({ title: "Error", description: (response as any).message || "Community not found or data incomplete.", variant: "destructive" });
        navigate('/communities', { replace: true });
      }
    } catch (error: any) {
      console.error("Error fetching community details (catch block):", error);
      toast({ title: "Fetch Error", description: error.message || "Failed to load community details.", variant: "destructive" });
      navigate('/communities', { replace: true });
    } finally {
      setIsLoadingCommunity(false);
    }
  }, [communityIdOrSlug, navigate]);

  const fetchPosts = useCallback(async (page = 1, existingCommunityId?: string, currentSortBy = sortBy) => {
    // ... (keep existing fetchPosts logic)
    const actualCommunityId = existingCommunityId || community?.id;
    if (!actualCommunityId) {
        setIsLoadingPosts(false);
        return;
    }
    if (page === 1) setIsLoadingPosts(true);

    const params = new URLSearchParams();
    params.append('page', page.toString());
    params.append('limit', '10');
    params.append('sortBy', currentSortBy);

    try {
      const response = await apiClient<PaginatedResponse<any>>(`/communities/${actualCommunityId}/posts?${params.toString()}`);
      if (response.status === 'success' && Array.isArray(response.data)) {
        const normalizedPosts = response.data.map(normalizePostData);
        setPosts(prev => page === 1 ? normalizedPosts : [...prev, ...normalizedPosts]);
        const itemsPerPage = 10;
        setTotalPostsPages(response.results ? Math.ceil(response.results / itemsPerPage) : page + (response.data.length < itemsPerPage ? 0 : 1));
        setCurrentPostsPage(page);
      } else {
        if (page === 1) setPosts([]);
        toast({ title: "Posts", description: (response as any).message || "Could not load posts.", variant: "default" });
      }
    } catch (error: any) {
      if (page === 1) setPosts([]);
      toast({ title: "Error Fetching Posts", description: error.message || "Failed to fetch posts.", variant: "destructive" });
    } finally {
      if (page === 1) setIsLoadingPosts(false); // ensure this is also set for subsequent pages if desired
      else setIsLoadingPosts(false); // if you want loading indicator for "load more"
    }
  }, [community?.id, sortBy]);

  useEffect(() => {
    fetchCommunityDetails();
  }, [communityIdOrSlug, fetchCommunityDetails]);

  useEffect(() => {
    if (community?.id) {
      fetchPosts(1, community.id, sortBy);
    }
  }, [community?.id, sortBy, fetchPosts]);

  const handleJoinLeave = async () => {
    // ... (keep existing handleJoinLeave logic)
    if (!community || !community.id) {
      toast({ title: "Error", description: "Community data not loaded. Please try again.", variant: "destructive" });
      return;
    }
    if (!isAuthenticated) {
        toast({title: "Action Denied", description: "Please log in.", variant: "destructive"});
        navigate('/login/student');
        return;
    }
    if (isProcessingJoinLeave) return;
    setIsProcessingJoinLeave(true);

    const originalIsMember = community.is_member;
    const originalMemberCount = community.memberCount;
    const actionEndpoint = community.is_member ? `/communities/${community.id}/leave` : `/communities/${community.id}/join`;
    
    setCommunity(prev => prev ? ({ ...prev, is_member: !prev.is_member, memberCount: prev.is_member ? (prev.memberCount ?? 1) - 1 : (prev.memberCount ?? 0) + 1 }) : null);

    try {
      const response = await apiClient<{ status: string; message?: string; data?: { community: any } }>(actionEndpoint, { method: 'POST' });
      if (response.status === 'success') {
        toast({ title: "Success", description: response.message || `Successfully ${originalIsMember ? 'left' : 'joined'}!` });
        if (response.data?.community) {
            setCommunity(normalizeCommunityData(response.data.community));
        } else {
            fetchCommunityDetails();
        }
      } else {
        throw new Error(response.message || "Action failed");
      }
    } catch (error: any) {
      toast({ title: "Error", description: error.message || "Could not complete action.", variant: "destructive" });
      setCommunity(prev => prev ? ({ ...prev, is_member: originalIsMember, memberCount: originalMemberCount }) : null);
    } finally {
        setIsProcessingJoinLeave(false);
    }
  };

  const handleCreatePostModalOpen = () => setIsCreatePostOpen(true);
  const handleCreatePostModalClose = () => setIsCreatePostOpen(false);

  const handlePostCreated = (newPostData?: any) => {
    // ... (keep existing handlePostCreated logic)
    setIsCreatePostOpen(false);
    toast({title: "Post Created!", description: "Your post has been submitted."});
    if(community?.id) {
        if (newPostData && (newPostData.id || newPostData._id)) {
            const normalizedNewPost = normalizePostData(newPostData);
            setPosts(prev => [normalizedNewPost, ...prev]);
            setCommunity(prev => prev ? ({...prev, postCount: (prev.postCount || 0) + 1}) : null);
        } else {
            setSortBy('new');
            fetchPosts(1, community.id, 'new');
            if (community) setCommunity(prev => prev ? ({...prev, postCount: (prev.postCount || 0) + 1}) : null);
        }
    }
  };

  const handlePostVoteChange = (postId: string, newVoteData: VoteApiResponse['data']) => {
    // ... (keep existing handlePostVoteChange logic)
    setPosts(prevPosts => prevPosts.map(p =>
      p.id === postId ? { ...p, upvotes: newVoteData.upvotes, downvotes: newVoteData.downvotes, userVote: newVoteData.user_vote } : p
    ));
  };

  if (authIsLoading || isLoadingCommunity) {
    return <div className="flex items-center justify-center min-h-screen"><Loader2 className="h-8 w-8 animate-spin text-unicampus-red" /> Loading Community...</div>;
  }
  if (!community) {
    return <div className="flex items-center justify-center min-h-screen p-4 text-center">Community not found. Please check the URL or try again.</div>;
  }

  return (
    <div className="min-h-screen bg-gray-100 dark:bg-gray-950 pb-20">
      <div className="bg-white dark:bg-gray-900 shadow-sm px-4 py-3 sticky top-0 z-30">
        <div className="flex items-center space-x-2">
          <Button variant="ghost" size="icon" onClick={() => navigate('/communities')} title="Back to Communities"> <ChevronLeft className="h-6 w-6" /> </Button>
          <div className="flex-1 min-w-0"> <h1 className="text-lg font-bold text-gray-900 dark:text-white truncate" title={community.name}> {community.name} </h1> </div>
          {isAuthenticated && (
            <Button size="sm" className="bg-unicampus-red hover:bg-unicampus-red-dark text-white text-xs px-3 py-1.5" onClick={handleCreatePostModalOpen} disabled={isProcessingJoinLeave}> <Edit3 className="h-4 w-4 mr-1.5"/> Create Post </Button>
          )}
        </div>
      </div>

      <div className="space-y-0">
        <Card className="mx-0 rounded-none border-x-0 border-t-0 dark:border-gray-800">
          <CardContent className="p-0">
            {community.bannerImage && (
              <div className="h-32 sm:h-48 w-full overflow-hidden"> <img src={community.bannerImage} alt={`${community.name} banner`} className="w-full h-full object-cover" /> </div>
            )}
            <div className="p-4">
              <div className="flex flex-col sm:flex-row items-start sm:space-x-4">
                <div className="text-5xl sm:text-6xl -mt-8 sm:-mt-10 mb-2 sm:mb-0 bg-gray-200 dark:bg-gray-700 rounded-full p-1 border-4 border-white dark:border-gray-900 w-20 h-20 sm:w-24 sm:h-24 flex items-center justify-center flex-shrink-0"> {community.icon || '👥'} </div>
                <div className="flex-1 mt-1">
                  <h2 className="font-bold text-2xl text-gray-900 dark:text-white">{community.name}</h2>
                  <p className="text-gray-600 dark:text-gray-400 mt-1 text-sm">{community.description}</p>
                  <div className="flex items-center space-x-4 mt-2 text-xs text-gray-500 dark:text-gray-400">
                    <span className="flex items-center"><Users className="h-4 w-4 mr-1" /> {(community.memberCount ?? 0).toLocaleString()} members</span>
                    <span className="flex items-center"><MessageSquare className="h-4 w-4 mr-1" /> {(community.postCount ?? 0).toLocaleString()} posts</span>
                  </div>
                </div>
                <div className="flex items-center space-x-2 mt-2 sm:mt-0 flex-shrink-0"> {/* Container for Join/Leave and Edit buttons */}
                    {isAuthenticated && (
                        <Button
                        variant={community.is_member ? "default" : "outline"}
                        size="sm"
                        onClick={handleJoinLeave}
                        disabled={isProcessingJoinLeave}
                        className={` ${community.is_member ? "bg-unicampus-red text-white hover:bg-unicampus-red-dark" : "border-unicampus-red text-unicampus-red hover:bg-unicampus-red hover:text-white dark:border-unicampus-red dark:text-unicampus-red dark:hover:bg-unicampus-red dark:hover:text-white"}`}
                        > {isProcessingJoinLeave ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : (community.is_member ? 'Joined' : 'Join Community')} </Button>
                    )}
                    {/* --- NEW EDIT COMMUNITY BUTTON --- */}
                    {isOwner && (
                        <Button
                            variant="outline"
                            size="sm" // Match the size of Join/Leave button for consistency
                            onClick={handleEditCommunity}
                            className="dark:border-gray-600 dark:text-gray-300 dark:hover:bg-gray-700" // Example dark mode styling
                            title="Update Community Details"
                        >
                            <EditIcon className="mr-1.5 h-4 w-4" />
                            Update
                        </Button>
                    )}
                    {/* --- END NEW EDIT COMMUNITY BUTTON --- */}
                </div>
              </div>
              {community.tags && community.tags.length > 0 && (
                <div className="mt-3 flex flex-wrap gap-1.5"> {community.tags.map(tag => (<Badge key={tag} variant="secondary" className="text-xs">{tag}</Badge>))} </div>
              )}
            </div>
            {community.rules && community.rules.length > 0 && (
                <div className="border-t dark:border-gray-700 p-4">
                    <h4 className="text-sm font-semibold mb-1.5 text-gray-700 dark:text-gray-300">Community Rules:</h4>
                    <ul className="list-disc list-inside text-xs text-gray-600 dark:text-gray-400 space-y-1"> {community.rules.map((rule, i) => <li key={i}>{rule}</li>)} </ul>
                </div>
            )}
          </CardContent>
        </Card>

        {/* ... (rest of your posts section) ... */}
        <div className="p-4 space-y-3">
          <div className="flex justify-between items-center mb-3">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Posts</h3>
            <Select value={sortBy} onValueChange={(value: 'new' | 'hot' | 'top') => setSortBy(value)} disabled={isLoadingPosts}>
                <SelectTrigger className="w-[120px] h-8 text-xs dark:bg-gray-800 dark:border-gray-700"> <SelectValue placeholder="Sort by" /> </SelectTrigger>
                <SelectContent className="dark:bg-gray-800">
                    <SelectItem value="new">Newest</SelectItem>
                    <SelectItem value="hot">Hot</SelectItem>
                    <SelectItem value="top">Top</SelectItem>
                </SelectContent>
            </Select>
          </div>

          {isLoadingPosts && posts.length === 0 ? (
            <div className="text-center py-8"><Loader2 className="h-6 w-6 animate-spin text-unicampus-red mx-auto" /> Loading posts...</div>
          ) : posts.length > 0 ? (
            posts.map((post, index) => (
              <PostListItem key={post.id} post={post} index={index} onClick={() => navigate(`/posts/${post.id}`)} onVoteChange={handlePostVoteChange} />
            ))
          ) : (
            <Card className="dark:bg-gray-800">
              <CardContent className="p-8 text-center">
                 <MessageSquare className="mx-auto h-10 w-10 text-gray-400 dark:text-gray-500 mb-3" />
                <p className="text-gray-500 dark:text-gray-400">No posts yet in {community.name}.</p>
                {isAuthenticated && (<Button size="sm" className="mt-4 bg-unicampus-red hover:bg-unicampus-red-dark text-white" onClick={() => setIsCreatePostOpen(true)}>Be the first to post!</Button>)}
              </CardContent>
            </Card>
          )}
          {!isLoadingPosts && currentPostsPage < totalPostsPages && posts.length > 0 && (
            <div className="text-center mt-6"><Button variant="outline" onClick={() => fetchPosts(currentPostsPage + 1, community.id, sortBy)} disabled={isLoadingPosts}>
            {isLoadingPosts && <Loader2 className="mr-2 h-4 w-4 animate-spin" />} Load More Posts</Button></div>
          )}
           {!isLoadingPosts && posts.length > 0 && currentPostsPage >= totalPostsPages && (
             <p className="text-center text-sm text-gray-500 dark:text-gray-400 mt-6">You've seen all posts!</p>
           )}
        </div>
      </div>

      {isAuthenticated && community && community.id && (
        <CreatePostScreen isOpen={isCreatePostOpen} onClose={handleCreatePostModalClose} preselectedCommunityId={community.id} onPostCreated={handlePostCreated} />
      )}
      <BottomNavigation />
    </div>
  );
};

export default CommunityDetailScreen;