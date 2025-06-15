
-- Add RLS policies for sentences table to allow admin operations
-- Since this is an admin panel, we'll create policies that allow authenticated users to manage sentences

-- Policy to allow authenticated users to view all sentences
CREATE POLICY "Allow authenticated users to view sentences" 
  ON public.sentences 
  FOR SELECT 
  TO authenticated 
  USING (true);

-- Policy to allow authenticated users to insert sentences
CREATE POLICY "Allow authenticated users to insert sentences" 
  ON public.sentences 
  FOR INSERT 
  TO authenticated 
  WITH CHECK (true);

-- Policy to allow authenticated users to update sentences
CREATE POLICY "Allow authenticated users to update sentences" 
  ON public.sentences 
  FOR UPDATE 
  TO authenticated 
  USING (true) 
  WITH CHECK (true);

-- Policy to allow authenticated users to delete sentences
CREATE POLICY "Allow authenticated users to delete sentences" 
  ON public.sentences 
  FOR DELETE 
  TO authenticated 
  USING (true);
