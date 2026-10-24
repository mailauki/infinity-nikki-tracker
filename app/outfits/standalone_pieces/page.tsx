import { Metadata } from 'next'
import PageShell from '@/components/page-shell'
import { pageTitle } from '@/lib/sitemap/routes'
import OutfitToolBar from '../outfit-toolbar'
import StandalonePieces from './standalone-pieces'

export const metadata: Metadata = {
  title: pageTitle('/outfits/standalone_pieces'),
}

export default function StandalonePiecesPage() {
  return (
    <>
      <OutfitToolBar />
      <PageShell>
        <StandalonePieces />
      </PageShell>
    </>
  )
}
