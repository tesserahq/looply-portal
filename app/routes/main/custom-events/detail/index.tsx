import { redirect } from 'react-router'

export async function loader({ params }: { params: { event_id: string } }) {
  return redirect(`/custom-events/${params.event_id}/overview`)
}

export default function Index() {
  return null
}
