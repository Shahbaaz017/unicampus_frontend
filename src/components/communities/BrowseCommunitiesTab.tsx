import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Loader2, Search, Users, MessageSquare } from 'lucide-react';
import apiClient, { PaginatedResponse } from '@/lib/apiClient';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from '@/hooks/use-toast';
import { CommunitySummary } from '@/types/community';

const BrowseCommunitiesTab = () => {
  const navigate = useNavigate();
  const { user, isAuthenticated, isLoading: authIsLoading } = useAuth();

  const [communities, setCommunities] = useState<CommunitySummary[]>([]);
  const [isLoading, setIsLoading] = useState(true); // Manages overall loading state for the list
  const [isFetchingMore, setIsFetchingMore] = useState(false); // Specific for "load more"
  const [searchQuery, setSearchQuery] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalResults, setTotalResults] = useState(0);

  const [debouncedSearchQuery, setDebouncedSearchQuery] = useState('');
  useEffect(() => {
    const handler = setTimeout(() => setDebouncedSearchQuery(searchQuery), 500);
    return () => clearTimeout(handler);
  }, [searchQuery]);

  const fetchCommunities = useCallback(async (page = 1, isNewSearch = false) => {
    if (authIsLoading) return; // Don't fetch if auth state is still loading
    if (!isAuthenticated && page === 1) { // If not authenticated on initial load, clear and stop
        setCommunities([]);
        setTotalPages(1);
        setTotalResults(0);
        setCurrentPage(1);
        setIsLoading(false);
        return;
    }
    
    if (page === 1) setIsLoading(true); else setIsFetchingMore(true);

    const params = new URLSearchParams();
    params.append('page', page.toString());
    params.append('limit', '10');
    if (debouncedSearchQuery.trim()) {
      params.append('searchQuery', debouncedSearchQuery.trim());
    }

    try {
      const response = await apiClient<PaginatedResponse<CommunitySummary>>(`/communities?${params.toString()}`);
      if (response.status === 'success' && Array.isArray(response.data)) {
        const processedData = response.data.map(community => ({
            ...community,
            memberCount: community.memberCount ?? 0,
            postCount: community.postCount ?? 0,
            icon: community.icon_url || community.icon, // Ensure icon from API is prioritized
            bannerImage: community.banner_image_url || community.bannerImage,
        }));
        
        setCommunities(prev => (page === 1 || isNewSearch) ? processedData : [...prev, ...processedData]);
        
        const itemsPerPage = response.pagination?.perPage || 10;
        setTotalResults(response.pagination?.totalItems || response.results || 0);
        setTotalPages(response.pagination?.totalPages || Math.ceil((response.results || 0) / itemsPerPage));
        setCurrentPage(response.pagination?.currentPage || page);

      } else {
        // toast({ title: "Error", description: response.message || "Could not load communities.", variant: "default" });
        if (page === 1) { setCommunities([]); setTotalPages(1); setTotalResults(0); }
      }
    } catch (error: any) {
      toast({ title: "Error", description: error.message || "Failed to fetch communities.", variant: "destructive" });
      if (page === 1) { setCommunities([]); setTotalPages(1); setTotalResults(0); }
    } finally {
      if (page === 1) setIsLoading(false); else setIsFetchingMore(false);
    }
  }, [isAuthenticated, authIsLoading, debouncedSearchQuery]);

  useEffect(() => {
    // Effect for initial load and when debouncedSearchQuery changes (which implies new search)
    if (!authIsLoading) {
        fetchCommunities(1, true); // true for isNewSearch
    }
  }, [debouncedSearchQuery, authIsLoading, fetchCommunities]); // Removed isAuthenticated from deps if fetchCommunities handles it


  const handleJoinCommunity = async (communityId: string, e: React.MouseEvent) => {
    e.stopPropagation(); // Prevent card click
    if (!isAuthenticated) {
      toast({ title: "Authentication Required", description: "Please log in to join communities.", variant: "destructive"});
      navigate('/login/student');
      return;
    }

    // Optimistic UI update
    const originalCommunities = communities.map(c => ({...c})); // Deep copy for potential revert
    setCommunities(prev => prev.map(c => c.id === communityId ? { ...c, is_member: true, memberCount: (c.memberCount ?? 0) + 1 } : c));
    
    try {
      const response = await apiClient<{status: string, message?: string, data?: {community: CommunitySummary}}>(`/communities/${communityId}/join`, { method: 'POST' });
      if(response.status === 'success'){
        toast({ title: "Success", description: response.message || "Joined community!" });
        // If API returns the updated community, update it precisely
        if (response.data?.community) {
            const updatedCommunity = {
                ...response.data.community,
                icon: response.data.community.icon_url || response.data.community.icon,
                bannerImage: response.data.community.banner_image_url || response.data.community.bannerImage,
            };
            setCommunities(prev => prev.map(c => c.id === communityId ? updatedCommunity : c));
        }
        // else, the optimistic update is usually fine, or could re-fetch the list if necessary.
      } else {
        throw new Error(response.message || "Failed to join community");
      }
    } catch (error: any) {
      toast({ title: "Error", description: error.message || "Failed to join community.", variant: "destructive" });
      setCommunities(originalCommunities); // Revert on error
    }
  };

  const handleLoadMore = () => {
    if (currentPage < totalPages && !isLoading && !isFetchingMore) {
      fetchCommunities(currentPage + 1, false);
    }
  };

  if (authIsLoading && isLoading) { // Show loading only if auth is determining state AND initial content is loading
    return <div className="flex-1 p-4 text-center flex items-center justify-center min-h-[calc(100vh-200px)]"><Loader2 className="h-6 w-6 animate-spin text-unicampus-red mr-2" /> Loading...</div>;
  }
  if (!isAuthenticated && !authIsLoading) {
    return <div className="flex-1 p-4 text-center">Please log in to browse communities.</div>;
  }

  return (
    <div className="flex-1 bg-gray-50 dark:bg-gray-950">
      <div className="p-4 space-y-4">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
          <Input
            type="search"
            placeholder="Search communities..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10 w-full dark:bg-gray-800 dark:border-gray-700 dark:text-white"
          />
        </div>

        {isLoading && communities.length === 0 && (
          <div className="flex justify-center items-center py-10">
            <Loader2 className="h-8 w-8 animate-spin text-unicampus-red" />
            <span className="ml-2 text-gray-600 dark:text-gray-400">Loading communities...</span>
          </div>
        )}

        {!isLoading && communities.length === 0 && (
          <Card className="dark:bg-gray-800">
            <CardContent className="p-8 text-center">
              <Users className="mx-auto h-12 w-12 text-gray-400 dark:text-gray-500 mb-4" />
              <p className="text-gray-600 dark:text-gray-400">
                No communities found {debouncedSearchQuery && `matching "${debouncedSearchQuery}"`}.
              </p>
            </CardContent>
          </Card>
        )}

        {communities.map((community, index) => (
          <Card
            key={community.id}
            className="animate-slide-up cursor-pointer hover:shadow-lg transition-all dark:bg-gray-800 dark:hover:border-unicampus-red/50"
            style={{ animationDelay: `${index * 0.05}s` }}
            onClick={() => navigate(`/communities/${community.slug || community.id}`)}
          >
            <CardContent className="p-0">
              {community.bannerImage && (
                <div className="h-32 w-full overflow-hidden rounded-t-lg">
                  <img src={community.bannerImage} alt={`${community.name} banner`} className="w-full h-full object-cover" />
                </div>
              )}
              <div className="p-4">
                <div className="flex items-start"> {/* Main flex container for icon, content, button */}
                  {/* --- ICON DISPLAY FIXED --- */}
                  <div className="w-12 h-12 rounded-lg bg-gray-200 dark:bg-gray-700 flex items-center justify-center overflow-hidden flex-shrink-0 mr-4">
                    {community.icon ? (
                      <img src={community.icon} alt={`${community.name} icon`} className="w-full h-full object-cover" />
                    ) : (
                      <span className="text-2xl text-gray-500 dark:text-gray-400">👥</span>
                    )}
                  </div>
                  
                  <div className="flex-1 min-w-0"> {/* Text content area */}
                    <h3 className="font-semibold text-lg text-gray-900 dark:text-white hover:text-unicampus-red truncate" title={community.name}>
                      {community.name}
                    </h3>
                    <p className="text-sm text-gray-600 dark:text-gray-400 mt-0.5 mb-1.5 line-clamp-2" title={community.description}>
                      {community.description}
                    </p>
                    <div className="flex items-center flex-wrap gap-x-3 gap-y-1 text-xs text-gray-500 dark:text-gray-400">
                      <span className="flex items-center"><Users className="h-3.5 w-3.5 mr-1" /> {(community.memberCount ?? 0).toLocaleString()} members</span>
                      {(community.postCount !== undefined && community.postCount !== null) && (
                        <span className="flex items-center"><MessageSquare className="h-3.5 w-3.5 mr-1" />{community.postCount.toLocaleString()} posts</span>
                      )}
                    </div>
                  </div>

                  {/* Join Button / Joined Badge */}
                  <div className="ml-auto self-start flex-shrink-0">
                    {!community.is_member && user && ( // Show join if not member AND user is present
                       <Button
                          size="sm"
                          variant="outline"
                          className="border-unicampus-red text-unicampus-red hover:bg-unicampus-red hover:text-white dark:hover:bg-unicampus-red dark:hover:text-white"
                          onClick={(e) => handleJoinCommunity(community.id, e)}
                        > Join </Button>
                    )}
                     {community.is_member && user && ( // Show joined if member AND user is present
                       <Badge variant="secondary" className="bg-green-100 text-green-700 dark:bg-green-800 dark:text-green-200">Joined</Badge>
                    )}
                  </div>
                </div>
                {community.tags && community.tags.length > 0 && (
                    <div className="mt-3 flex flex-wrap gap-1">
                        {community.tags.slice(0, 3).map(tag => ( // Show limited tags
                            <Badge key={tag} variant="outline" className="text-xs">{tag}</Badge>
                        ))}
                    </div>
                )}
              </div>
            </CardContent>
          </Card>
        ))}
        
        {!isLoading && currentPage < totalPages && communities.length > 0 && (
          <div className="text-center mt-6">
            <Button variant="outline" onClick={handleLoadMore} disabled={isFetchingMore}>
              {isFetchingMore ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null} Load More
            </Button>
          </div>
        )}
         {!isLoading && !isFetchingMore && communities.length > 0 && currentPage >= totalPages && (
            <p className="text-center text-sm text-gray-500 dark:text-gray-400 mt-6">You've reached the end!</p>
        )}
      </div>
    </div>
  );
};

export default BrowseCommunitiesTab;
