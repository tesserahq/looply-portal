import { redirect } from 'react-router'

export async function loader({ params }: { params: { segment_id: string } }) {
  return redirect(`/segments/${params.segment_id}/overview`)
}

export default function Index() {
  return null
}
