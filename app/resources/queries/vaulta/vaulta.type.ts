/* eslint-disable @typescript-eslint/no-explicit-any */
export type IAssetResponse = {
  asset_id: string
  url: string
  serve_url: string
  name: string
  filename: string
  mime_type: string
  size: number
  human_readable_size: string
  labels: any
  state: string
  state_message: string
  extracted_data: any
  summary: any
}

export type IAssetInput = {
  file: any
  name?: string
  labels?: string
  extract_data?: boolean
  summarize?: boolean
  expires_in?: number
}
