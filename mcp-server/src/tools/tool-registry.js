import { z } from "zod";
import {
  getCategories,
  listComponents,
  searchComponents,
  recommendComponents,
  submitRecommendationFeedback,
  getRecommendationFeedbackStats,
  buildExperimentPagePlan,
  composeExperimentBundle,
  getComponent
} from "./catalog.js";

function jsonResponse(payload) {
  return {
    content: [
      {
        type: "text",
        text: JSON.stringify(payload, null, 2)
      }
    ]
  };
}

function registerTools(server) {
  server.registerTool(
    "get_categories",
    {
      title: "Get component categories",
      description: "Return all available component categories with localized names and counts.",
      inputSchema: {
        locale: z.string().optional()
      }
    },
    async ({ locale } = {}) => jsonResponse({ categories: getCategories(locale) })
  );

  server.registerTool(
    "list_components",
    {
      title: "List components",
      description: "List component summaries filtered by category, tag, and event support.",
      inputSchema: {
        category: z.string().optional(),
        tag: z.string().optional(),
        hasEvents: z.boolean().optional(),
        limit: z.number().int().positive().optional(),
        locale: z.string().optional()
      }
    },
    async (input) => jsonResponse(listComponents(input))
  );

  server.registerTool(
    "search_components",
    {
      title: "Search components",
      description: "Lexically search components by id, names, tags, and category metadata.",
      inputSchema: {
        query: z.string().min(1),
        category: z.string().optional(),
        limit: z.number().int().positive().optional(),
        locale: z.string().optional()
      }
    },
    async (input) => jsonResponse(searchComponents(input))
  );

  server.registerTool(
    "recommend_components",
    {
      title: "Recommend components",
      description:
        "Recommend best-fit components for a teaching or product scenario using explainable scoring over subjects, goals, categories, tags, and interaction signals.",
      inputSchema: {
        subject: z.string().min(1),
        lessonGoal: z.string().min(1),
        customerId: z.string().optional(),
        audience: z.string().optional(),
        interactionMode: z.string().optional(),
        mustIncludeTags: z.array(z.string()).optional(),
        preferredCategories: z.array(z.string()).optional(),
        excludeCategories: z.array(z.string()).optional(),
        limit: z.number().int().positive().optional(),
        locale: z.string().optional()
      }
    },
    async (input) => jsonResponse(recommendComponents(input))
  );

  server.registerTool(
    "submit_recommendation_feedback",
    {
      title: "Submit recommendation feedback",
      description:
        "Record selection, click, save, dismiss, or hide feedback so future recommendations can rerank dynamically.",
      inputSchema: {
        componentId: z.string().min(1),
        customerId: z.string().optional(),
        feedbackType: z.enum(["viewed", "clicked", "selected", "saved", "dismissed", "hidden"]),
        subject: z.string().optional(),
        lessonGoal: z.string().optional(),
        audience: z.string().optional(),
        interactionMode: z.string().optional(),
        preferredCategories: z.array(z.string()).optional(),
        mustIncludeTags: z.array(z.string()).optional(),
        signalWeight: z.number().positive().optional()
      }
    },
    async (input) => jsonResponse(await submitRecommendationFeedback(input))
  );

  server.registerTool(
    "get_recommendation_feedback_stats",
    {
      title: "Get recommendation feedback stats",
      description: "Return in-memory feedback aggregates used by the reranking layer.",
      inputSchema: {
        customerId: z.string().optional()
      }
    },
    async () => jsonResponse(getRecommendationFeedbackStats())
  );

  server.registerTool(
    "build_experiment_page",
    {
      title: "Build experiment page plan",
      description:
        "Generate a structured lesson or experiment page plan with sections, selected component ids, implementation notes, and assembly steps.",
      inputSchema: {
        subject: z.string().min(1),
        lessonGoal: z.string().min(1),
        customerId: z.string().optional(),
        audience: z.string().optional(),
        interactionMode: z.string().optional(),
        pageType: z.string().optional(),
        mustIncludeTags: z.array(z.string()).optional(),
        preferredCategories: z.array(z.string()).optional(),
        maxComponents: z.number().int().positive().optional(),
        locale: z.string().optional()
      }
    },
    async (input) => jsonResponse(buildExperimentPagePlan(input))
  );

  server.registerTool(
    "compose_experiment_bundle",
    {
      title: "Compose experiment bundle",
      description:
        "Produce a render-ready bundle with selected component HTML, layout hints, render order, and host integration instructions.",
      inputSchema: {
        subject: z.string().optional(),
        lessonGoal: z.string().optional(),
        customerId: z.string().optional(),
        audience: z.string().optional(),
        interactionMode: z.string().optional(),
        pageType: z.string().optional(),
        componentIds: z.array(z.string()).optional(),
        mustIncludeTags: z.array(z.string()).optional(),
        preferredCategories: z.array(z.string()).optional(),
        maxComponents: z.number().int().positive().optional(),
        locale: z.string().optional()
      }
    },
    async (input) => jsonResponse(composeExperimentBundle(input))
  );

  server.registerTool(
    "get_component",
    {
      title: "Get a component",
      description: "Return a full component record including manifest-derived registry fields and complete HTML.",
      inputSchema: {
        id: z.string().min(1),
        locale: z.string().optional()
      }
    },
    async ({ id, locale }) => {
      try {
        return jsonResponse(getComponent(id, locale));
      } catch (error) {
        if (error && error.code === "COMPONENT_NOT_FOUND") {
          return {
            isError: true,
            content: [
              {
                type: "text",
                text: JSON.stringify(
                  {
                    error: "Component not found",
                    id: error.data.id,
                    suggestions: error.data.suggestions
                  },
                  null,
                  2
                )
              }
            ]
          };
        }
        throw error;
      }
    }
  );
}

export { jsonResponse, registerTools };
