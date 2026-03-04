import type { Meta, StoryObj } from "@storybook/react-vite";
import { GeometricSignature } from "./GeometricSignature";

function SignatureShowcase() {
	const codes = [
		{ code: "OCEAR", label: "All High" },
		{ code: "TFRDR", label: "All Low" },
		{ code: "MSBPT", label: "All Mid" },
		{ code: "OCBAN", label: "Mixed (Open Diplomat)" },
		{ code: "TFRAR", label: "Mixed (Quiet Helper)" },
	];

	return (
		<div style={{ display: "flex", flexDirection: "column", gap: 32 }}>
			{codes.map(({ code, label }) => (
				<div key={code}>
					<div style={{ fontSize: 12, color: "var(--muted-foreground)", marginBottom: 4 }}>
						{label} — {code}
					</div>
					<GeometricSignature oceanCode={code} baseSize={48} />
				</div>
			))}
		</div>
	);
}

const meta = {
	title: "Brand/GeometricSignature",
	component: GeometricSignature,
	parameters: {
		layout: "centered",
	},
	tags: ["autodocs"],
} satisfies Meta<typeof GeometricSignature>;

export default meta;
type Story = StoryObj<typeof meta>;

export const VariousCodes: Story = {
	name: "Various OCEAN Codes",
	render: () => <SignatureShowcase />,
	args: { oceanCode: "OCEAR" },
};

export const WithArchetype: Story = {
	name: "With Archetype Name",
	args: {
		oceanCode: "OCEAR",
		baseSize: 64,
		archetypeName: "Creative Diplomat",
	},
};

export const RevealAnimation: Story = {
	name: "Reveal Animation",
	render: () => (
		<div style={{ display: "flex", flexDirection: "column", gap: 32, alignItems: "center" }}>
			<div style={{ fontSize: 14, color: "var(--muted-foreground)" }}>
				Reload this story to replay the animation
			</div>
			<GeometricSignature oceanCode="OCEAR" baseSize={64} animate archetypeName="Creative Diplomat" />
		</div>
	),
	args: { oceanCode: "OCEAR" },
};
