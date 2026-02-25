import Image from 'next/image'

export function Hero() {
  return (
    <div className="relative h-full w-full">
      <Image
        src="https://static.wikia.nocookie.net/infinity-nikki/images/7/78/Infinity_Nikki_Key_Art.png/revision/latest?cb=20241206171432"
        alt="Infinity Nikki Hero Image"
        width={0}
        height={0}
        sizes="(max-width: 768px) 100vw"
        className="w-full object-cover object-[70%_center]"
        fill
      />
      <div className="absolute bottom-0 right-0 z-20 flex w-full flex-col items-center py-40">
        <h1 className="mx-auto max-w-xl px-4 text-center text-3xl !leading-tight md:text-4xl">
          Infinity Nikki Tracker
        </h1>
        <p className="mx-auto max-w-md px-4 text-center text-lg !leading-tight md:text-xl">
          Track your collection from your favorite cozy open-world game Infinity Nikki
        </p>
      </div>
      <div className="absolute bottom-0 right-0 z-10 h-[50%] w-full bg-gradient-to-t from-background from-50% to-transparent to-80%" />
    </div>
  )
}
