import { q as jsxRuntimeExports } from "../server.js";
import { u as useNavigate } from "./router-BKS0gMzo.js";
import { B as Button } from "./button-eboxan6j.js";
import { W as Waves, L as Lightbulb, Z as Zap, a as Heart, H as Handshake, T as TrendingUp } from "./zap-CxWIexXM.js";
import "node:async_hooks";
import "node:stream";
import "util";
import "crypto";
import "async_hooks";
import "stream";
import "node:stream/web";
import "./utils-QXBWQHlM.js";
function App() {
  const navigate = useNavigate();
  const traits = [{
    icon: /* @__PURE__ */ jsxRuntimeExports.jsx(Lightbulb, { className: "w-12 h-12 text-amber-400" }),
    title: "Openness",
    description: "Curiosity, creativity, and appreciation for new ideas and experiences. High scorers are imaginative and enjoy intellectual pursuits."
  }, {
    icon: /* @__PURE__ */ jsxRuntimeExports.jsx(Zap, { className: "w-12 h-12 text-blue-400" }),
    title: "Conscientiousness",
    description: "Organization, discipline, and responsibility. High scorers are goal-oriented, dependable, and pay attention to detail."
  }, {
    icon: /* @__PURE__ */ jsxRuntimeExports.jsx(Heart, { className: "w-12 h-12 text-rose-400" }),
    title: "Extraversion",
    description: "Sociability, outgoingness, and enthusiasm. High scorers seek social interaction and stimulation from their environment."
  }, {
    icon: /* @__PURE__ */ jsxRuntimeExports.jsx(Handshake, { className: "w-12 h-12 text-green-400" }),
    title: "Agreeableness",
    description: "Compassion, cooperation, and empathy. High scorers are trusting, kind, and prioritize harmony in relationships."
  }, {
    icon: /* @__PURE__ */ jsxRuntimeExports.jsx(TrendingUp, { className: "w-12 h-12 text-purple-400" }),
    title: "Neuroticism",
    description: "Emotional stability and resilience. High scorers experience strong emotions and may be more sensitive to stress."
  }];
  return /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "min-h-screen bg-gradient-to-b from-slate-900 via-slate-800 to-slate-900", children: [
    /* @__PURE__ */ jsxRuntimeExports.jsxs("section", { className: "relative py-20 px-6 text-center overflow-hidden", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "absolute inset-0 bg-gradient-to-r from-blue-500/10 via-purple-500/10 to-cyan-500/10" }),
      /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "relative max-w-5xl mx-auto", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "mb-6", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx(Waves, { className: "w-20 h-20 mx-auto text-blue-400 mb-4" }),
          /* @__PURE__ */ jsxRuntimeExports.jsx("h1", { className: "text-6xl md:text-7xl font-black text-white [letter-spacing:-0.08em]", children: /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "bg-gradient-to-r from-blue-400 via-purple-400 to-cyan-400 bg-clip-text text-transparent", children: "Big Ocean" }) })
        ] }),
        /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-2xl md:text-3xl text-gray-300 mb-4 font-light", children: "Discover Your Personality With AI" }),
        /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-lg text-gray-400 max-w-3xl mx-auto mb-8", children: "Take a scientifically-backed personality assessment powered by AI. Understand yourself better through the Big Five personality model, one of the most respected frameworks in psychology." }),
        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex flex-col items-center gap-4", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx(Button, { onClick: () => navigate({
            to: "/chat",
            search: {
              sessionId: void 0
            }
          }), size: "lg", className: "px-8 py-6 bg-gradient-to-r from-blue-500 to-purple-500 hover:from-blue-600 hover:to-purple-600 text-white font-semibold rounded-lg transition-all shadow-lg shadow-blue-500/50 text-lg", children: "Start Assessment Now" }),
          /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-gray-400 text-sm mt-2", children: "Takes about 10-15 minutes · No account needed" })
        ] })
      ] })
    ] }),
    /* @__PURE__ */ jsxRuntimeExports.jsx("section", { className: "py-16 px-6 max-w-4xl mx-auto", children: /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "bg-slate-800/50 backdrop-blur-sm border border-slate-700 rounded-xl p-8 mb-12", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsx("h2", { className: "text-3xl font-bold text-white mb-4", children: "What is the Big Five?" }),
      /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-gray-300 leading-relaxed mb-4", children: "The Big Five (also called OCEAN) is one of the most widely accepted personality models in psychology. It measures five fundamental dimensions of personality that help explain how people differ from one another." }),
      /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-gray-400", children: "Our AI-powered therapist will ask you thoughtful questions about your behaviors, preferences, and reactions to different situations. As you answer, the system evaluates your personality across each dimension until it reaches high confidence in all five traits." })
    ] }) }),
    /* @__PURE__ */ jsxRuntimeExports.jsxs("section", { className: "py-16 px-6 max-w-7xl mx-auto", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsx("h2", { className: "text-3xl font-bold text-white text-center mb-12", children: "The Five Dimensions" }),
      /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6", children: traits.map((trait) => /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "bg-slate-800/50 backdrop-blur-sm border border-slate-700 rounded-xl p-6 hover:border-purple-500/50 transition-all duration-300 hover:shadow-lg hover:shadow-purple-500/10", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "mb-4", children: trait.icon }),
        /* @__PURE__ */ jsxRuntimeExports.jsx("h3", { className: "text-xl font-semibold text-white mb-3", children: trait.title }),
        /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-gray-400 leading-relaxed text-sm", children: trait.description })
      ] }, trait.title)) })
    ] }),
    /* @__PURE__ */ jsxRuntimeExports.jsx("section", { className: "py-20 px-6", children: /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "max-w-3xl mx-auto text-center", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsx("h2", { className: "text-4xl font-bold text-white mb-6", children: "Ready to Understand Yourself Better?" }),
      /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-xl text-gray-300 mb-8", children: "Chat with our AI therapist and get your personalized Big Five personality profile in minutes." }),
      /* @__PURE__ */ jsxRuntimeExports.jsx(Button, { onClick: () => navigate({
        to: "/chat",
        search: {
          sessionId: void 0
        }
      }), size: "lg", className: "px-12 py-6 bg-gradient-to-r from-purple-500 to-blue-500 hover:from-purple-600 hover:to-blue-600 text-white font-semibold rounded-lg transition-all shadow-lg shadow-purple-500/50 text-lg", children: "Start Your Assessment" })
    ] }) })
  ] });
}
export {
  App as component
};
