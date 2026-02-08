import type { Meta, StoryObj } from "@storybook/react-vite";

import { Button } from "./button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "./card";

const meta = {
	title: "UI/Card",
	component: Card,
	parameters: {
		layout: "centered",
	},
	tags: ["autodocs"],
} satisfies Meta<typeof Card>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
	args: {
		className: "w-[350px]",
		children: (
			<>
				<CardHeader>
					<CardTitle>Card Title</CardTitle>
					<CardDescription>Card description goes here.</CardDescription>
				</CardHeader>
				<CardContent>
					<p>Card content with any elements inside.</p>
				</CardContent>
				<CardFooter>
					<Button>Action</Button>
				</CardFooter>
			</>
		),
	},
};

export const Simple: Story = {
	args: {
		className: "w-[350px]",
		children: (
			<CardContent>
				<p>A simple card with only content, no header or footer.</p>
			</CardContent>
		),
	},
};

export const WithForm: Story = {
	args: {
		className: "w-[350px]",
		children: (
			<>
				<CardHeader>
					<CardTitle>Create Account</CardTitle>
					<CardDescription>Enter your details to get started.</CardDescription>
				</CardHeader>
				<CardContent className="space-y-4">
					<div className="space-y-2">
						<label htmlFor="card-name" className="text-sm font-medium">
							Name
						</label>
						<input
							id="card-name"
							placeholder="John Doe"
							className="w-full px-3 py-2 border rounded-md text-sm"
						/>
					</div>
					<div className="space-y-2">
						<label htmlFor="card-email" className="text-sm font-medium">
							Email
						</label>
						<input
							id="card-email"
							type="email"
							placeholder="john@example.com"
							className="w-full px-3 py-2 border rounded-md text-sm"
						/>
					</div>
				</CardContent>
				<CardFooter className="flex justify-between">
					<Button variant="outline">Cancel</Button>
					<Button>Submit</Button>
				</CardFooter>
			</>
		),
	},
};

export const HeaderOnly: Story = {
	args: {
		className: "w-[350px]",
		children: (
			<CardHeader>
				<CardTitle>Notifications</CardTitle>
				<CardDescription>You have 3 unread messages.</CardDescription>
			</CardHeader>
		),
	},
};
