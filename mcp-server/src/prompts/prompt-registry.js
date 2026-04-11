import { z } from "zod";

function registerPrompts(server) {
  server.registerPrompt(
    "component-recommendation-brief",
    {
      title: "Component Recommendation Brief",
      description: "Prompt template for agents that need to recommend suitable STEM components.",
      argsSchema: {
        subject: z.string().min(1).describe("Subject area such as physics, chemistry, biology, or math"),
        lessonGoal: z.string().min(1).describe("The teaching or product goal"),
        locale: z.string().optional().describe("Preferred locale, such as zh-CN or en")
      }
    },
    async ({ subject, lessonGoal, locale = "zh-CN" }) => {
      return {
        messages: [
          {
            role: "user",
            content: {
              type: "text",
              text:
                `You are selecting Open Lab Components for a ${subject} scenario.\n` +
                `Lesson goal: ${lessonGoal}\n` +
                `Preferred locale: ${locale}\n` +
                "Use MCP tools to identify the best-fit components, explain why they match, and return the most relevant component ids first."
            }
          }
        ]
      };
    }
  );

  server.registerPrompt(
    "component-page-builder",
    {
      title: "Component Page Builder",
      description: "Prompt template for generating a lesson or product page backed by Open Lab Components.",
      argsSchema: {
        audience: z.string().min(1).describe("Target audience, such as middle-school students or lab instructors"),
        pageGoal: z.string().min(1).describe("Desired page outcome"),
        locale: z.string().optional().describe("Preferred locale, such as zh-CN or en")
      }
    },
    async ({ audience, pageGoal, locale = "zh-CN" }) => {
      return {
        messages: [
          {
            role: "user",
            content: {
              type: "text",
              text:
                `Create a page plan for ${audience}.\n` +
                `Page goal: ${pageGoal}\n` +
                `Preferred locale: ${locale}\n` +
                "Use the Open Lab Components MCP server to find components, then propose a page structure, selected component ids, and reasons for each choice."
            }
          }
        ]
      };
    }
  );

  server.registerPrompt(
    "experiment-page-executor",
    {
      title: "Experiment Page Executor",
      description: "Prompt template for turning the page plan into a final lesson or product draft.",
      argsSchema: {
        subject: z.string().min(1).describe("Subject area such as physics or chemistry"),
        lessonGoal: z.string().min(1).describe("Teaching or product goal"),
        audience: z.string().optional().describe("Target audience"),
        locale: z.string().optional().describe("Preferred locale, such as zh-CN or en")
      }
    },
    async ({ subject, lessonGoal, audience = "general learners", locale = "zh-CN" }) => {
      return {
        messages: [
          {
            role: "user",
            content: {
              type: "text",
              text:
                `Create a final experiment or lesson page for ${audience}.\n` +
                `Subject: ${subject}\n` +
                `Goal: ${lessonGoal}\n` +
                `Preferred locale: ${locale}\n` +
                "First call build_experiment_page to generate the page structure, then use get_component for the chosen ids, and finally draft the page content with clear teacher and learner guidance."
            }
          }
        ]
      };
    }
  );

  server.registerPrompt(
    "experiment-bundle-integrator",
    {
      title: "Experiment Bundle Integrator",
      description: "Prompt template for turning bundle output into a final integrated host page implementation.",
      argsSchema: {
        subject: z.string().min(1).describe("Subject area"),
        lessonGoal: z.string().min(1).describe("Teaching or product goal"),
        audience: z.string().optional().describe("Target audience"),
        locale: z.string().optional().describe("Preferred locale")
      }
    },
    async ({ subject, lessonGoal, audience = "general learners", locale = "zh-CN" }) => {
      return {
        messages: [
          {
            role: "user",
            content: {
              type: "text",
              text:
                `Integrate an Open Lab Components lesson bundle for ${audience}.\n` +
                `Subject: ${subject}\n` +
                `Goal: ${lessonGoal}\n` +
                `Preferred locale: ${locale}\n` +
                "Call compose_experiment_bundle, preserve the returned render order and layout hints, then generate the final host-page integration plan with section copy, event wiring notes, and implementation steps."
            }
          }
        ]
      };
    }
  );
}

export { registerPrompts };
