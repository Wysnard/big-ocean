import type { ComponentPropsWithoutRef, ReactNode } from "react";
import { BottomNav } from "@/components/BottomNav";
import { PageMain } from "@/components/PageMain";
import { ThreeSpacePageContainer } from "@/components/ThreeSpacePageContainer";

interface ThreeSpaceLayoutProps
	extends Omit<ComponentPropsWithoutRef<typeof PageMain>, "children"> {
	children: ReactNode;
}

export function ThreeSpaceLayout({ children, ...props }: ThreeSpaceLayoutProps) {
	return (
		<PageMain {...props}>
			<BottomNav />
			<ThreeSpacePageContainer>{children}</ThreeSpacePageContainer>
		</PageMain>
	);
}
