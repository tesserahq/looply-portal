import { redirect } from 'react-router'

export async function loader({ params }: { params: { campaign_id: string } }) {
  return redirect(`/campaigns/${params.campaign_id}/overview`)
}

export default function Index() {
  return null
}
