import { Hero } from '@/components/hero'

export default function Home() {
  return (
    <>
      <Hero />
      <div className="flex w-full flex-1 flex-col items-center gap-20">
        <div className="flex max-w-5xl flex-1 flex-col gap-20 p-5"></div>
      </div>
    </>
  )
}
