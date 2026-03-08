-- Create community_posts table
CREATE TABLE public.community_posts (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  author_name TEXT NOT NULL DEFAULT 'Anonymous',
  author_initials TEXT NOT NULL DEFAULT 'ME',
  content TEXT NOT NULL,
  tag TEXT NOT NULL DEFAULT 'Question',
  likes INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.community_posts ENABLE ROW LEVEL SECURITY;

-- Anyone logged in can read all posts
CREATE POLICY "All users can view community posts"
  ON public.community_posts FOR SELECT
  USING (auth.uid() IS NOT NULL);

-- Users can only insert their own posts
CREATE POLICY "Users can insert their own posts"
  ON public.community_posts FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Users can delete their own posts
CREATE POLICY "Users can delete their own posts"
  ON public.community_posts FOR DELETE
  USING (auth.uid() = user_id);

-- Users can update likes on any post
CREATE POLICY "Users can update post likes"
  ON public.community_posts FOR UPDATE
  USING (auth.uid() IS NOT NULL);

-- Enable realtime
ALTER PUBLICATION supabase_realtime ADD TABLE public.community_posts;
