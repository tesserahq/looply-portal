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
