import { createClient } from '@supabase/supabase-js'
import * as dotenv from 'dotenv'

dotenv.config({ path: '.env.local' })

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!

const supabase = createClient(supabaseUrl, supabaseServiceKey)

async function setupBuckets() {
  console.log('Setting up avatars bucket...')

  // Check if bucket exists
  const { data: buckets, error: listError } = await supabase.storage.listBuckets()
  if (listError) {
    console.error('Error listing buckets:', listError)
    return
  }

  const avatarBucket = buckets.find((b) => b.name === 'avatars')

  if (!avatarBucket) {
    console.log('Creating "avatars" bucket...')
    const { error: createError } = await supabase.storage.createBucket('avatars', {
      public: true,
      allowedMimeTypes: ['image/jpeg', 'image/png', 'image/webp', 'image/gif'],
      fileSizeLimit: 2097152 // 2MB
    })

    if (createError) {
      console.error('Error creating bucket:', createError)
    } else {
      console.log('"avatars" bucket created successfully.')
    }
  } else {
    console.log('"avatars" bucket already exists.')
    
    // Ensure it is public
    if (!avatarBucket.public) {
      console.log('Making "avatars" bucket public...')
      const { error: updateError } = await supabase.storage.updateBucket('avatars', {
        public: true
      })
      if (updateError) console.error('Error updating bucket:', updateError)
    }
  }

  console.log('Storage setup complete.')
}

setupBuckets()
