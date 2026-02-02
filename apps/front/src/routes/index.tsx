import { createFileRoute, useNavigate } from "@tanstack/react-router";
import {
  Lightbulb,
  Heart,
  Zap,
  Handshake,
  TrendingUp,
  Waves,
} from "lucide-react";
import { Button } from "@workspace/ui/components/button";

export const Route = createFileRoute("/")({
  component: App,
});

function App() {
  const navigate = useNavigate();

  const traits = [
    {
      icon: <Lightbulb className="w-12 h-12 text-amber-400" />,
      title: "Openness",
      description:
        "Curiosity, creativity, and appreciation for new ideas and experiences. High scorers are imaginative and enjoy intellectual pursuits.",
    },
    {
      icon: <Zap className="w-12 h-12 text-blue-400" />,
      title: "Conscientiousness",
      description:
        "Organization, discipline, and responsibility. High scorers are goal-oriented, dependable, and pay attention to detail.",
    },
    {
      icon: <Heart className="w-12 h-12 text-rose-400" />,
      title: "Extraversion",
      description:
        "Sociability, outgoingness, and enthusiasm. High scorers seek social interaction and stimulation from their environment.",
    },
    {
      icon: <Handshake className="w-12 h-12 text-green-400" />,
      title: "Agreeableness",
      description:
        "Compassion, cooperation, and empathy. High scorers are trusting, kind, and prioritize harmony in relationships.",
    },
    {
      icon: <TrendingUp className="w-12 h-12 text-purple-400" />,
      title: "Neuroticism",
      description:
        "Emotional stability and resilience. High scorers experience strong emotions and may be more sensitive to stress.",
    },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-900 via-slate-800 to-slate-900">
      {/* Hero Section */}
      <section className="relative py-20 px-6 text-center overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-r from-blue-500/10 via-purple-500/10 to-cyan-500/10"></div>
        <div className="relative max-w-5xl mx-auto">
          <div className="mb-6">
            <Waves className="w-20 h-20 mx-auto text-blue-400 mb-4" />
            <h1 className="text-6xl md:text-7xl font-black text-white [letter-spacing:-0.08em]">
              <span className="bg-gradient-to-r from-blue-400 via-purple-400 to-cyan-400 bg-clip-text text-transparent">
                Big Ocean
              </span>
            </h1>
          </div>
          <p className="text-2xl md:text-3xl text-gray-300 mb-4 font-light">
            Discover Your Personality With AI
          </p>
          <p className="text-lg text-gray-400 max-w-3xl mx-auto mb-8">
            Take a scientifically-backed personality assessment powered by AI.
            Understand yourself better through the Big Five personality model,
            one of the most respected frameworks in psychology.
          </p>
          <div className="flex flex-col items-center gap-4">
            <Button
              onClick={() =>
                navigate({ to: "/chat", search: { sessionId: undefined } })
              }
              size="lg"
              className="px-8 py-6 bg-gradient-to-r from-blue-500 to-purple-500 hover:from-blue-600 hover:to-purple-600 text-white font-semibold rounded-lg transition-all shadow-lg shadow-blue-500/50 text-lg"
            >
              Start Assessment Now
            </Button>
            <p className="text-gray-400 text-sm mt-2">
              Takes about 10-15 minutes · No account needed
            </p>
          </div>
        </div>
      </section>

      {/* What is Big Five Section */}
      <section className="py-16 px-6 max-w-4xl mx-auto">
        <div className="bg-slate-800/50 backdrop-blur-sm border border-slate-700 rounded-xl p-8 mb-12">
          <h2 className="text-3xl font-bold text-white mb-4">
            What is the Big Five?
          </h2>
          <p className="text-gray-300 leading-relaxed mb-4">
            The Big Five (also called OCEAN) is one of the most widely accepted
            personality models in psychology. It measures five fundamental
            dimensions of personality that help explain how people differ from
            one another.
          </p>
          <p className="text-gray-400">
            Our AI-powered therapist will ask you thoughtful questions about
            your behaviors, preferences, and reactions to different situations.
            As you answer, the system evaluates your personality across each
            dimension until it reaches high confidence in all five traits.
          </p>
        </div>
      </section>

      {/* Five Traits Section */}
      <section className="py-16 px-6 max-w-7xl mx-auto">
        <h2 className="text-3xl font-bold text-white text-center mb-12">
          The Five Dimensions
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6">
          {traits.map((trait) => (
            <div
              key={trait.title}
              className="bg-slate-800/50 backdrop-blur-sm border border-slate-700 rounded-xl p-6 hover:border-purple-500/50 transition-all duration-300 hover:shadow-lg hover:shadow-purple-500/10"
            >
              <div className="mb-4">{trait.icon}</div>
              <h3 className="text-xl font-semibold text-white mb-3">
                {trait.title}
              </h3>
              <p className="text-gray-400 leading-relaxed text-sm">
                {trait.description}
              </p>
            </div>
          ))}
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 px-6">
        <div className="max-w-3xl mx-auto text-center">
          <h2 className="text-4xl font-bold text-white mb-6">
            Ready to Understand Yourself Better?
          </h2>
          <p className="text-xl text-gray-300 mb-8">
            Chat with our AI therapist and get your personalized Big Five
            personality profile in minutes.
          </p>
          <Button
            onClick={() =>
              navigate({ to: "/chat", search: { sessionId: undefined } })
            }
            size="lg"
            className="px-12 py-6 bg-gradient-to-r from-purple-500 to-blue-500 hover:from-purple-600 hover:to-blue-600 text-white font-semibold rounded-lg transition-all shadow-lg shadow-purple-500/50 text-lg"
          >
            Start Your Assessment
          </Button>
        </div>
      </section>
    </div>
  );
}
