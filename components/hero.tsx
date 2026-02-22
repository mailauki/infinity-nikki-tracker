import Image from 'next/image'

export function Hero() {
  return (
		<div className='relative w-full h-full'>
      <Image
        src="https://static.wikia.nocookie.net/infinity-nikki/images/7/78/Infinity_Nikki_Key_Art.png/revision/latest?cb=20241206171432"
        alt="Infinity Nikki Hero Image"
        width={0}
        height={0}
				sizes="(max-width: 768px) 100vw, 50vw"
        className="h-auto w-full opacity-60 object-cover object-[70%_center] z-0"
				fill
      />
			<div className='absolute flex flex-col items-center w-full h-full py-40 z-100'>
      <h1 className="sr-only">Infinity Nikki Tracker</h1>
      <p className="mx-auto max-w-xl px-4 text-center text-2xl !leading-tight md:text-3xl">
        Track your collection from your favorite cozy open-world game Infinity Nikki
      </p>
      <div className="via-foreground/10 my-8 w-full bg-gradient-to-r from-transparent to-transparent p-[1px]" />
			</div>
    </div>
  )
}
