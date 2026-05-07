import { createLazyFileRoute } from '@tanstack/react-router'

// Placeholder asset detail page
function AssetDetail() {
  const { assetId } = Route.useParams()

  return (
    <div className='p-8'>
      <h1 className='text-2xl font-bold mb-4'>Asset Details</h1>
      <p className='text-muted-foreground'>
        Asset ID: <code className='bg-muted px-2 py-1 rounded'>{assetId}</code>
      </p>
      <p className='text-muted-foreground mt-4'>
        Asset detail page coming soon...
      </p>
    </div>
  )
}

export const Route = createLazyFileRoute('/_authenticated/assets/$assetId')({
  component: AssetDetail,
})
