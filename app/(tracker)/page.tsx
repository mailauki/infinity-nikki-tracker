import { Hero } from "@/components/hero";

export default function Home() {
  return (
		<>
			<Hero />
			<div className="flex-1 w-full flex flex-col gap-20 items-center">
				<div className="flex-1 flex flex-col gap-20 max-w-5xl p-5">
				</div>
			</div>
		</>
  );
}
