/**
 * A campaign recipient, as recorded once at send time, joined with the
 * contact's current details and (once poll_campaign_engagement has run)
 * first-occurrence engagement timestamps.
 */
export type CampaignRecipientType = {
  id: string
  campaign_id: string
  contact: {
    id: string
    first_name: string | null
    last_name: string | null
    company: string | null
    job: string | null
    contact_type: string
    phone_type: string
    phone: string | null
    email: string | null
  }
  opened_at: string | null
  clicked_at: string | null
  created_at: string
}
