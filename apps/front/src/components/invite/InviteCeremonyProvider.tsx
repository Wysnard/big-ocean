import { createContext, useCallback, useContext, useMemo, useState } from "react";
import { InviteCeremonyDialog } from "./InviteCeremonyDialog";

export type InviteCeremonyOpenOptions = {
	presetName?: string;
};

type InviteCeremonyContextValue = {
	openCeremony: (opts?: InviteCeremonyOpenOptions) => void;
};

const InviteCeremonyContext = createContext<InviteCeremonyContextValue | null>(null);

const NO_OP_VALUE: InviteCeremonyContextValue = { openCeremony: () => {} };

export function useInviteCeremony(): InviteCeremonyContextValue {
	return useContext(InviteCeremonyContext) ?? NO_OP_VALUE;
}

export function InviteCeremonyProvider({ children }: { children: React.ReactNode }) {
	const [open, setOpen] = useState(false);
	const [presetName, setPresetName] = useState<string | undefined>(undefined);

	const openCeremony = useCallback((opts?: InviteCeremonyOpenOptions) => {
		setPresetName(opts?.presetName);
		setOpen(true);
	}, []);

	const value = useMemo(() => ({ openCeremony }), [openCeremony]);

	return (
		<InviteCeremonyContext.Provider value={value}>
			{children}
			<InviteCeremonyDialog
				open={open}
				presetName={presetName}
				onOpenChange={(next) => {
					if (!next) {
						setOpen(false);
						setPresetName(undefined);
					} else {
						setOpen(true);
					}
				}}
			/>
		</InviteCeremonyContext.Provider>
	);
}
