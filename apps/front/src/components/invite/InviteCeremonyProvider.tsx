import {
	Drawer,
	DrawerContent,
	DrawerDescription,
	DrawerHeader,
	DrawerTitle,
} from "@workspace/ui/components/drawer";
import { createContext, useCallback, useContext, useMemo } from "react";
import { QrDrawerContent } from "@/components/relationship/QrDrawer";
import { useQrDrawer } from "@/hooks/useQrDrawer";

type InviteCeremonyContextValue = {
	openCeremony: () => void;
};

const InviteCeremonyContext = createContext<InviteCeremonyContextValue | null>(null);

const NO_OP_VALUE: InviteCeremonyContextValue = { openCeremony: () => {} };

export function useInviteCeremony(): InviteCeremonyContextValue {
	return useContext(InviteCeremonyContext) ?? NO_OP_VALUE;
}

export function InviteCeremonyProvider({ children }: { children: React.ReactNode }) {
	const { isOpen, open, close, isLoading, token, shareUrl, status, error, retry } = useQrDrawer();

	const openCeremony = useCallback(() => {
		open();
	}, [open]);

	const value = useMemo(() => ({ openCeremony }), [openCeremony]);

	return (
		<InviteCeremonyContext.Provider value={value}>
			{children}
			<Drawer
				open={isOpen}
				onOpenChange={(next) => {
					if (!next) close();
				}}
			>
				<DrawerContent data-testid="invite-qr-drawer">
					<DrawerHeader className="sr-only">
						<DrawerTitle>Invite Someone</DrawerTitle>
						<DrawerDescription>
							Share a QR code to invite someone for a relationship analysis
						</DrawerDescription>
					</DrawerHeader>
					<QrDrawerContent
						isLoading={isLoading}
						token={token}
						shareUrl={shareUrl}
						status={status}
						error={error}
						onClose={close}
						onRetry={retry}
					/>
				</DrawerContent>
			</Drawer>
		</InviteCeremonyContext.Provider>
	);
}
