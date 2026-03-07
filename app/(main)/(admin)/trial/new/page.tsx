import AddTrialForm from '@/components/forms/trial/add-trial-form'
import { Metadata } from 'next'
import PageContainer from '@/components/page-container'

export const metadata: Metadata = {
  title: 'Add Trial',
}

export default function NewTrialPage() {
  return (
    <PageContainer title='Add Trial' size='sm'>
      <AddTrialForm />
		</PageContainer>
  )
}
