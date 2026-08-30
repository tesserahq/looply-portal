// Query functions
export {
  getCampaigns,
  getCampaign,
  createCampaign,
  updateCampaign,
  deleteCampaign,
  sendCampaign,
} from './campaign.queries'

// Types
export type { CampaignType, CreateCampaignPayload, UpdateCampaignPayload } from './campaign.type'

// Recipient query functions
export { getCampaignRecipients } from './campaign-recipient.queries'

// Recipient types
export type { CampaignRecipientType } from './campaign-recipient.type'
