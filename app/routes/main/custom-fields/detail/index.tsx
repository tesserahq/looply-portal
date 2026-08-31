import { redirect } from 'react-router'

export async function loader({ params }: { params: { definition_id: string } }) {
  return redirect(`/custom-fields/${params.definition_id}/overview`)
}

export default function Index() {
  return null
}
