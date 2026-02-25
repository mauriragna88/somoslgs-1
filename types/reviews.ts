export interface Review {
  id: string
  business_id: string
  user_id: string
  rating: number
  comment: string | null
  response: string | null
  responded_at: string | null
  created_at: string
  profile?: { full_name: string; avatar_url: string | null }
}
