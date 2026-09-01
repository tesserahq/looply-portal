import { redirect } from 'react-router'

export async function loader({ params }: { params: { event_mapping_id: string } }) {
  return redirect(`/event-mappings/${params.event_mapping_id}/overview`)
}

export default function Index() {
  return null
}
