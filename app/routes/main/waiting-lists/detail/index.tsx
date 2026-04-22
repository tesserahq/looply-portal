import { redirect } from 'react-router'

export async function loader({ params }: { params: { waiting_list_id: string } }) {
  return redirect(`/waiting-lists/${params.waiting_list_id}/overview`)
}

export default function Index() {
  return null
}
