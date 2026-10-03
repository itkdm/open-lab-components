import { z } from "zod";
import { ResourceTemplate } from "@modelcontextprotocol/sdk/server/mcp.js";
import {
  buildExperimentPagePlan,
  composeExperimentBundle,
  getCategories,
  getComponent,
  getInteractiveCatalogSummary,
  getRecommendationFeedbackStats,
  getLessonReadyCatalogSummary,
  getSubjectCatalogSummary,
  listComponents,
  recommendComponents,
  searchComponents,
  submitRecommendationFeedback,
  validateExperimentBundle
} from "../tools/catalog.js";

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

function createPromptMessage(text) {
  return {
    messages: [
      {
        role: "user",
        content: {
          type: "text",
          text
        }
      }
    ]
  };
}

const TOOL_DEFINITIONS = [
  {
    name: "get_categories",
    title: "Get component categories",
    description: "Return all available component categories with localized names and counts.",
    inputSchema: {
      locale: z.string().optional()
    },
    handler: async ({ locale } = {}) => jsonResponse({ categories: getCategories(locale) })
  },
  {
    name: "list_components",
    title: "List components",
    description: "List component summaries filtered by category, tag, and event support.",
    inputSchema: {
      category: z.string().optional(),
      tag: z.string().optional(),
      hasEvents: z.boolean().optional(),
      limit: z.number().int().positive().optional(),
      locale: z.string().optional()
    },
    handler: async (input) => jsonResponse(listComponents(input))
  },
  {
    name: "search_components",
    title: "Search components",
    description: "Lexically search components by id, names, tags, and category metadata.",
    inputSchema: {
      query: z.string().min(1),
      category: z.string().optional(),
      limit: z.number().int().positive().optional(),
      locale: z.string().optional()
    },
    handler: async (input) => jsonResponse(searchComponents(input))
  },
  {
    name: "recommend_components",
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
      excludeComponentIds: z.array(z.string()).optional(),
      preferInteractive: z.boolean().optional(),
      requiredInteractionLevel: z.string().optional(),
      maxPerCategory: z.number().int().positive().optional(),
      limit: z.number().int().positive().optional(),
      locale: z.string().optional()
    },
    handler: async (input) => jsonResponse(recommendComponents(input))
  },
  {
    name: "submit_recommendation_feedback",
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
    },
    handler: async (input) => jsonResponse(await submitRecommendationFeedback(input))
  },
  {
    name: "get_recommendation_feedback_stats",
    title: "Get recommendation feedback stats",
    description: "Return in-memory feedback aggregates used by the reranking layer.",
    inputSchema: {
      customerId: z.string().optional()
    },
    handler: async () => jsonResponse(getRecommendationFeedbackStats())
  },
  {
    name: "build_experiment_page",
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
    },
    handler: async (input) => jsonResponse(buildExperimentPagePlan(input))
  },
  {
    name: "compose_experiment_bundle",
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
    },
    handler: async (input) => jsonResponse(composeExperimentBundle(input))
  },
  {
    name: "validate_experiment_bundle",
    title: "Validate experiment bundle",
    description:
      "Validate page-plan sections or render bundle items before a host integrates them into a final lesson page.",
    inputSchema: {
      sections: z
        .array(
          z.object({
            recommendedComponentId: z.string().optional(),
            sectionType: z.string().optional(),
            slot: z.string().optional(),
            interactionLevel: z.string().optional(),
            hostRequirements: z.array(z.string()).optional()
          })
        )
        .optional(),
      items: z
        .array(
          z.object({
            sectionType: z.string().optional(),
            slot: z.string().optional(),
            layoutHint: z.string().optional(),
            interactionLevel: z.string().optional(),
            hostRequirements: z.array(z.string()).optional(),
            component: z
              .object({
                id: z.string().optional()
              })
              .optional()
          })
        )
        .optional()
    },
    handler: async (input) => jsonResponse(validateExperimentBundle(input))
  },
  {
    name: "get_component",
    title: "Get a component",
    description: "Return a full component record including manifest-derived registry fields and complete HTML.",
    inputSchema: {
      id: z.string().min(1),
      locale: z.string().optional()
    },
    handler: async ({ id, locale }) => {
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
  }
];

const PROMPT_DEFINITIONS = [
  {
    name: "component-recommendation-brief",
    title: "Component Recommendation Brief",
    description: "Prompt template for agents that need to recommend suitable STEM components.",
    argsSchema: {
      subject: z.string().min(1).describe("Subject area such as physics, chemistry, biology, or math"),
      lessonGoal: z.string().min(1).describe("The teaching or product goal"),
      locale: z.string().optional().describe("Preferred locale, such as zh-CN or en")
    },
    handler: async ({ subject, lessonGoal, locale = "zh-CN" }) =>
      createPromptMessage(
        `You are selecting Open Lab Components for a ${subject} scenario.\n` +
          `Lesson goal: ${lessonGoal}\n` +
          `Preferred locale: ${locale}\n` +
          "Use MCP tools to identify the best-fit components, explain why they match, and return the most relevant component ids first."
      )
  },
  {
    name: "component-page-builder",
    title: "Component Page Builder",
    description: "Prompt template for generating a lesson or product page backed by Open Lab Components.",
    argsSchema: {
      audience: z.string().min(1).describe("Target audience, such as middle-school students or lab instructors"),
      pageGoal: z.string().min(1).describe("Desired page outcome"),
      locale: z.string().optional().describe("Preferred locale, such as zh-CN or en")
    },
    handler: async ({ audience, pageGoal, locale = "zh-CN" }) =>
      createPromptMessage(
        `Create a page plan for ${audience}.\n` +
          `Page goal: ${pageGoal}\n` +
          `Preferred locale: ${locale}\n` +
          "Use the Open Lab Components MCP server to find components, then propose a page structure, selected component ids, and reasons for each choice."
      )
  },
  {
    name: "experiment-page-executor",
    title: "Experiment Page Executor",
    description: "Prompt template for turning the page plan into a final lesson or product draft.",
    argsSchema: {
      subject: z.string().min(1).describe("Subject area such as physics or chemistry"),
      lessonGoal: z.string().min(1).describe("Teaching or product goal"),
      audience: z.string().optional().describe("Target audience"),
      locale: z.string().optional().describe("Preferred locale, such as zh-CN or en")
    },
    handler: async ({ subject, lessonGoal, audience = "general learners", locale = "zh-CN" }) =>
      createPromptMessage(
        `Create a final experiment or lesson page for ${audience}.\n` +
          `Subject: ${subject}\n` +
          `Goal: ${lessonGoal}\n` +
          `Preferred locale: ${locale}\n` +
          "First call build_experiment_page to generate the page structure, then use get_component for the chosen ids, and finally draft the page content with clear teacher and learner guidance."
      )
  },
  {
    name: "experiment-bundle-integrator",
    title: "Experiment Bundle Integrator",
    description: "Prompt template for turning bundle output into a final integrated host page implementation.",
    argsSchema: {
      subject: z.string().min(1).describe("Subject area"),
      lessonGoal: z.string().min(1).describe("Teaching or product goal"),
      audience: z.string().optional().describe("Target audience"),
      locale: z.string().optional().describe("Preferred locale")
    },
    handler: async ({ subject, lessonGoal, audience = "general learners", locale = "zh-CN" }) =>
      createPromptMessage(
        `Integrate an Open Lab Components lesson bundle for ${audience}.\n` +
          `Subject: ${subject}\n` +
          `Goal: ${lessonGoal}\n` +
          `Preferred locale: ${locale}\n` +
          "Call compose_experiment_bundle, preserve the returned render order and layout hints, then generate the final host-page integration plan with section copy, event wiring notes, and implementation steps."
      )
  }
];

const RESOURCE_DEFINITIONS = [
  {
    name: "catalog-overview",
    uri: "openlab://catalog/overview",
    title: "Catalog Overview",
    description: "Platform summary for hosts and AI clients.",
    mimeType: "application/json",
    handler: async () => {
      const categories = getCategories("en");
      const topCategories = categories
        .slice()
        .sort((a, b) => b.count - a.count || a.category.localeCompare(b.category))
        .slice(0, 10);

      return {
        contents: [
          {
            uri: "openlab://catalog/overview",
            text: JSON.stringify(
              {
                componentCount: categories.reduce((sum, item) => sum + item.count, 0),
                categoryCount: categories.length,
                locales: ["zh-CN", "en"],
                topCategories
              },
              null,
              2
            )
          }
        ]
      };
    }
  },
  {
    name: "catalog-categories",
    uri: "openlab://catalog/categories",
    title: "Catalog Categories",
    description: "Localized category metadata for the component registry.",
    mimeType: "application/json",
    handler: async () => ({
      contents: [
        {
          uri: "openlab://catalog/categories",
          text: JSON.stringify({ categories: getCategories("en") }, null, 2)
        }
      ]
    })
  },
  {
    name: "featured-components",
    uri: "openlab://catalog/featured",
    title: "Featured Components",
    description: "Representative components for hosts that want quick discovery context.",
    mimeType: "application/json",
    handler: async () => {
      const items = listComponents({ limit: 12, locale: "en" }).items;
      return {
        contents: [
          {
            uri: "openlab://catalog/featured",
            text: JSON.stringify({ items }, null, 2)
          }
        ]
      };
    }
  },
  {
    name: "interactive-components",
    uri: "openlab://catalog/interactive",
    title: "Interactive Components",
    description: "Discovery summary for interactive components with events and stronger host value.",
    mimeType: "application/json",
    handler: async () => ({
      contents: [
        {
          uri: "openlab://catalog/interactive",
          text: JSON.stringify(getInteractiveCatalogSummary("en"), null, 2)
        }
      ]
    })
  },
  {
    name: "lesson-ready-components",
    uri: "openlab://catalog/lesson-ready",
    title: "Lesson-ready Components",
    description: "Discovery summary for components with stronger quality signals and lesson readiness.",
    mimeType: "application/json",
    handler: async () => ({
      contents: [
        {
          uri: "openlab://catalog/lesson-ready",
          text: JSON.stringify(getLessonReadyCatalogSummary("en"), null, 2)
        }
      ]
    })
  },
  {
    name: "subject-components",
    uri: new ResourceTemplate("openlab://catalog/subject/{subject}", {
      list: async () => ({
        resources: ["physics", "chemistry", "biology", "math"].map((subject) => ({
          uri: `openlab://catalog/subject/${subject}`,
          name: `catalog-subject-${subject}`
        }))
      })
    }),
    title: "Subject Components",
    description: "Discovery summary for a subject-scoped component catalog slice.",
    mimeType: "application/json",
    handler: async (_uri, variables) => {
      const subject = typeof variables.subject === "string" ? variables.subject : "physics";
      return {
        contents: [
          {
            uri: `openlab://catalog/subject/${subject}`,
            text: JSON.stringify(getSubjectCatalogSummary(subject, "en"), null, 2)
          }
        ]
      };
    }
  },
  {
    name: "component-resistor",
    uri: "openlab://component/phy.resistor.axial.basic",
    title: "Reference Component",
    description: "A concrete component resource that demonstrates how a host can read component payloads.",
    mimeType: "application/json",
    handler: async () => ({
      contents: [
        {
          uri: "openlab://component/phy.resistor.axial.basic",
          text: JSON.stringify(getComponent("phy.resistor.axial.basic", "en"), null, 2)
        }
      ]
    })
  }
];

export { jsonResponse, PROMPT_DEFINITIONS, RESOURCE_DEFINITIONS, TOOL_DEFINITIONS };
