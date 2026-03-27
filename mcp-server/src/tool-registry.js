import { z } from "zod";
import {
  getCategories,
  listComponents,
  searchComponents,
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
