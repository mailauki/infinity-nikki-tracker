import Image from "next/image";

export function Hero() {
  return (
    <div className="flex flex-col gap-16 items-center">
			<Image
				src="https://static.wikia.nocookie.net/infinity-nikki/images/7/78/Infinity_Nikki_Key_Art.png/revision/latest/scale-to-width-down/1000?cb=20241206171432"
				alt="Infinity Nikki Hero Image"
				width={0}
				height={0}
				sizes="100vw" // Tells the browser the image is 100% of viewport width
				className="w-full h-auto opacity-75 dark:opacity-60"
			/>
      <h1 className="sr-only">Infinity Nikki Tracker</h1>
      <p className="text-2xl md:text-3xl !leading-tight mx-auto max-w-xl text-center px-4">
				Track your collection from your favorite cozy open-world game Infinity Nikki
      </p>
      <div className="w-full p-[1px] bg-gradient-to-r from-transparent via-foreground/10 to-transparent my-8" />
    </div>
  );
}
