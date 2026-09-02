// Client-side helpers over POST /api/follows. See the route handler for why the
// write path is a route rather than a Server Action.

async function post(targetId: string, action: 'follow' | 'unfollow') {
  const res = await fetch('/api/follows', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ targetId, action }),
  })

  if (!res.ok) {
    const message = await res
      .json()
      .then((body: { error?: string }) => body.error)
      .catch(() => null)
    throw new Error(message ?? `POST /api/follows returned ${res.status}`)
  }
}

export function followUser(targetId: string) {
  return post(targetId, 'follow')
}

export function unfollowUser(targetId: string) {
  return post(targetId, 'unfollow')
}
