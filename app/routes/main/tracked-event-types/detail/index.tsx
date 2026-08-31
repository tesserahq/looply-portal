import { redirect } from 'react-router'

export async function loader({ params }: { params: { tracked_event_type_id: string } }) {
  return redirect(`/tracked-event-types/${params.tracked_event_type_id}/overview`)
}

export default function Index() {
  return null
}
