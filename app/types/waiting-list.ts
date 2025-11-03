import { IContact } from './contact'

export interface IWaitingList {
  id: string
  name: string
  description: string
  created_by_id: string
  created_at: string
  updated_at: string
}

export interface IWaitingListStatus {
  value: string
  label: string
  description: string
}

export interface IWaitingListMember {
  id: string
  status: string
  contact: IContact
}
