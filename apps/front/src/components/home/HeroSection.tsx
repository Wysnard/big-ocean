import { Link } from "@tanstack/react-router";
import { OceanShapeSet } from "../ocean-shapes/OceanShapeSet";

export function HeroSection() {
	return (
		<section
			data-slot="hero-section"
			className="relative grid min-h-screen items-center gap-11 px-6 py-24 max-[900px]:grid-cols-1 max-[900px]:text-center min-[900px]:grid-cols-[1.1fr_1fr] min-[900px]:px-20 min-[900px]:py-[100px]"
		>
			{/* Left: Text content */}
			<div>
				{/* Brand mark */}
				<div className="mb-6 flex items-center gap-2 max-[900px]:justify-center">
					<span className="font-heading text-4xl font-bold tracking-tight text-foreground">big-</span>
					<OceanShapeSet size={36} className="sm:hidden" />
					<OceanShapeSet size={44} className="hidden sm:inline-flex" />
				</div>

				<h1 className="mb-[18px] font-heading text-[clamp(2.4rem,5vw,4rem)] font-bold leading-[1.06]">
					Not a personality quiz.{" "}
					<span className="bg-gradient-to-r from-primary via-[#FF1493] to-secondary bg-clip-text text-transparent">
						A conversation.
					</span>
				</h1>

				<p className="mb-6 max-w-[440px] text-[1.05rem] leading-[1.7] text-muted-foreground max-[900px]:mx-auto">
					A portrait of who you are that no test has ever given you.
				</p>

				<div className="mb-8 font-mono text-[.72rem] tracking-[.05em] text-muted-foreground">
					30 MIN &middot; NO ACCOUNT &middot; JUST TALKING
				</div>

				<Link
					to="/chat"
					data-testid="hero-cta"
					className="inline-flex items-center gap-[10px] rounded-xl bg-gradient-to-r from-primary to-secondary px-[34px] py-[15px] font-heading text-[.95rem] font-semibold text-white transition-[transform,box-shadow] duration-200 hover:translate-y-[-2px] hover:shadow-[0_8px_28px_rgba(255,0,128,.28)]"
				>
					Begin Your Dive &darr;
				</Link>
			</div>

			{/* Right: OCEAN shapes with breathing animation */}
			<div
				className="relative flex h-[380px] items-center justify-center max-[900px]:mx-auto max-[900px]:mt-6 max-[900px]:h-[230px]"
				aria-hidden="true"
			>
				{/* Openness Circle */}
				<div
					className="absolute top-[10px] left-[50px] h-[160px] w-[160px] rounded-full motion-safe:animate-[breathe_6s_ease-in-out_infinite] max-[900px]:top-[5px] max-[900px]:left-[30px] max-[900px]:h-[110px] max-[900px]:w-[110px]"
					style={{ backgroundColor: "var(--trait-openness)", opacity: 0.8 }}
				/>

				{/* Conscientiousness Rectangle */}
				<div
					className="absolute top-[60px] right-[30px] h-[165px] w-[110px] rotate-12 rounded-[11px] motion-safe:animate-[breathe_6s_ease-in-out_infinite] max-[900px]:top-[30px] max-[900px]:right-[15px] max-[900px]:h-[110px] max-[900px]:w-[70px]"
					style={{
						backgroundColor: "var(--trait-conscientiousness)",
						opacity: 0.75,
						animationDelay: "-1.2s",
					}}
				/>

				{/* Extraversion Triangle */}
				<div
					className="absolute bottom-[30px] left-[90px] motion-safe:animate-[breathe_6s_ease-in-out_infinite] max-[900px]:bottom-[15px] max-[900px]:left-[50px]"
					style={{
						width: 0,
						height: 0,
						borderLeft: "65px solid transparent",
						borderRight: "65px solid transparent",
						borderBottom: "130px solid var(--trait-extraversion)",
						opacity: 0.7,
						animationDelay: "-2.4s",
					}}
				/>

				{/* Agreeableness Half-circle */}
				<div
					className="absolute right-[55px] bottom-[45px] h-[70px] w-[140px] rounded-t-full motion-safe:animate-[breathe_6s_ease-in-out_infinite] max-[900px]:right-[35px] max-[900px]:bottom-[25px] max-[900px]:h-[50px] max-[900px]:w-[100px]"
					style={{
						backgroundColor: "var(--trait-agreeableness)",
						opacity: 0.75,
						animationDelay: "-3.6s",
					}}
				/>

				{/* Neuroticism Diamond */}
				<div
					className="absolute top-[155px] left-[185px] h-[78px] w-[78px] rotate-45 motion-safe:animate-[breathe_6s_ease-in-out_infinite] max-[900px]:top-[80px] max-[900px]:left-[120px] max-[900px]:h-[55px] max-[900px]:w-[55px]"
					style={{ backgroundColor: "var(--trait-neuroticism)", opacity: 0.85, animationDelay: "-4.8s" }}
				/>
			</div>

			{/* Scroll cue */}
			<div
				className="absolute bottom-7 left-1/2 flex -translate-x-1/2 flex-col items-center gap-[3px] text-[.78rem] text-muted-foreground motion-safe:animate-[bob_2.5s_ease-in-out_infinite]"
				aria-hidden="true"
			>
				<span>Scroll to descend</span>
				<span>&darr;</span>
			</div>
		</section>
	);
}
