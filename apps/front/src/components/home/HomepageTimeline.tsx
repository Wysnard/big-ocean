import { HomepageConversationPreview } from "./HomepageConversationPreview";
import { HomepagePortraitPreview } from "./HomepagePortraitPreview";
import { HomepageReassurancePlaceholder } from "./HomepageReassurancePlaceholder";
import { HomepageWorldAfterPreview } from "./HomepageWorldAfterPreview";

export function HomepageTimeline() {
	return (
		<div data-slot="homepage-timeline" className="flex min-w-0 flex-col">
			<HomepageConversationPreview />
			<HomepagePortraitPreview />
			<HomepageWorldAfterPreview />
			<HomepageReassurancePlaceholder />
		</div>
	);
}
