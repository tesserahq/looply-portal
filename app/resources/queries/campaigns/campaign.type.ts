/**
 * Campaign Type
 */
export type CampaignType = {
  id: string
  name: string
  contact_list_id: string
  project_id: string | null
  template_id: string
  template_variables: Record<string, unknown>
  from_email: string
  subject: string
  tags: string[]
  created_by_id: string
  status: string
  batch_id: string | null
  sent_at: string | null
  completed_at: string | null
  created_at: string
  updated_at: string
}

/**
 * Payload for creating a campaign
 */
export type CreateCampaignPayload = {
  name: string
  contact_list_id: string
  project_id?: string
  template_id: string
  from_email: string
  subject: string
  tags?: string[]
  template_variables?: Record<string, unknown>
}

/**
 * Payload for updating a campaign
 */
export type UpdateCampaignPayload = Partial<CreateCampaignPayload>
