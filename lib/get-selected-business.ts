import { cookies } from 'next/headers'
import { createClient } from '@/lib/supabase/server'

export interface SelectedBusiness {
  id: string
  name: string
  slug: string
  logo_url: string | null
  subscription_tier: string
  is_active: boolean
  status: string
  owner_id: string
  category_id: string | null
  phone: string
  whatsapp: string | null
  description: string | null
  address: string | null
  [key: string]: unknown
}

/**
 * Gets the selected business for the current user from cookies
 * Falls back to the first business if no selection exists
 */
export async function getSelectedBusiness(userId: string): Promise<SelectedBusiness | null> {
  const supabase = await createClient()
  const cookieStore = await cookies()
  const selectedBusinessId = cookieStore.get('selected_business_id')?.value

  // Get all businesses for the user
  const { data: businesses } = await supabase
    .from('businesses')
    .select('*')
    .eq('owner_id', userId) as { data: SelectedBusiness[] | null }

  if (!businesses || businesses.length === 0) {
    return null
  }

  // Find the selected business or use the first one
  const selectedBusiness = selectedBusinessId
    ? businesses.find(b => b.id === selectedBusinessId) || businesses[0]
    : businesses[0]

  return selectedBusiness as SelectedBusiness
}

/**
 * Gets all businesses for the current user
 */
export async function getUserBusinesses(userId: string): Promise<SelectedBusiness[]> {
  const supabase = await createClient()

  const { data: businesses } = await supabase
    .from('businesses')
    .select('*')
    .eq('owner_id', userId) as { data: SelectedBusiness[] | null }

  return businesses || []
}

