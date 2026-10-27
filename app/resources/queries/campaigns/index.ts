// Query functions
export {
  getCampaigns,
  getCampaign,
  createCampaign,
  updateCampaign,
  deleteCampaign,
  sendCampaign,
  sendTestCampaign,
  duplicateCampaign,
} from './campaign.queries'

// Types
export type {
  CampaignType,
  CreateCampaignPayload,
  TestSendCampaignPayload,
  TestSendCampaignResponse,
  UpdateCampaignPayload,
} from './campaign.type'

// Recipient query functions
export { getCampaignRecipients } from './campaign-recipient.queries'

// Recipient types
export type { CampaignRecipientType } from './campaign-recipient.type'
