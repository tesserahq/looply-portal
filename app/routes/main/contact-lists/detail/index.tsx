import { redirect } from 'react-router'

export async function loader({ params }: { params: { contact_list_id: string } }) {
  return redirect(`/contact-lists/${params.contact_list_id}/overview`)
}

export default function Index() {
  return null
}
