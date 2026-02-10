# Supabase Setup Instructions

## 1. Run Database Migration

1. Go to your Supabase project dashboard
2. Navigate to **SQL Editor**
3. Copy and paste the contents of `supabase/migrations/001_create_listings.sql`
4. Click **Run** to execute the migration

This will create:
- `listings` table
- `listing_images` table
- Indexes for performance
- Row-Level Security policies

## 2. Create Storage Bucket

1. Navigate to **Storage** in Supabase dashboard
2. Click **New bucket**
3. Configure:
   - **Name**: `listing-images`
   - **Public**: ✅ Enable (for public read access)
   - **File size limit**: 5MB
   - **Allowed MIME types**: `image/jpeg`, `image/png`, `image/webp`

4. After creating the bucket, go to **Policies**
5. Add the following policies:

### Upload Policy (Authenticated users can upload)
```sql
CREATE POLICY "Authenticated users can upload images"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'listing-images');
```

### Delete Policy (Users can delete their own images)
```sql
CREATE POLICY "Users can delete their own images"
ON storage.objects FOR DELETE
TO authenticated
USING (bucket_id = 'listing-images' AND auth.uid()::text = owner);
```

### Public Read Policy
```sql
CREATE POLICY "Public can read listing images"
ON storage.objects FOR SELECT
TO public
USING (bucket_id = 'listing-images');
```

## 3. Verify Setup

Run this query in SQL Editor to verify:

```sql
SELECT 
  schemaname, 
  tablename 
FROM pg_tables 
WHERE tablename IN ('listings', 'listing_images');
```

You should see both tables listed.

## 4. Test RLS Policies

Try querying as an authenticated user:

```sql
SELECT * FROM listings;
```

This should only show available listings or listings you own.
