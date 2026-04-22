import { redirect } from 'react-router'

export async function loader({ params }: { params: { contact_id: string } }) {
  return redirect(`/contacts/${params.contact_id}/overview`)
}

export default function Index() {
  return null
}
