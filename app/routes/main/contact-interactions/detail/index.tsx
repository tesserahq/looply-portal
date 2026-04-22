import { redirect } from 'react-router'

export async function loader({ params }: { params: { contact_interaction_id: string } }) {
  return redirect(`/contact-interactions/${params.contact_interaction_id}/overview`)
}

export default function Index() {
  return null
}
