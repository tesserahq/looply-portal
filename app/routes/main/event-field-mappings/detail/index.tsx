import { redirect } from 'react-router'

export async function loader({ params }: { params: { mapping_id: string } }) {
  return redirect(`/event-field-mappings/${params.mapping_id}/overview`)
}

export default function Index() {
  return null
}
