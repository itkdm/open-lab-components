import { getCategories, getComponent, listComponents } from "../tools/catalog.js";

function registerResources(server) {
  server.registerResource(
    "catalog-overview",
    "openlab://catalog/overview",
    {
      title: "Catalog Overview",
      description: "Platform summary for hosts and AI clients.",
      mimeType: "application/json"
    },
    async () => {
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
  );

  server.registerResource(
    "catalog-categories",
    "openlab://catalog/categories",
    {
      title: "Catalog Categories",
      description: "Localized category metadata for the component registry.",
      mimeType: "application/json"
    },
    async () => {
      return {
        contents: [
          {
            uri: "openlab://catalog/categories",
            text: JSON.stringify({ categories: getCategories("en") }, null, 2)
          }
        ]
      };
    }
  );

  server.registerResource(
    "featured-components",
    "openlab://catalog/featured",
    {
      title: "Featured Components",
      description: "Representative components for hosts that want quick discovery context.",
      mimeType: "application/json"
    },
    async () => {
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
  );

  server.registerResource(
    "component-resistor",
    "openlab://component/phy.resistor.axial.basic",
    {
      title: "Reference Component",
      description: "A concrete component resource that demonstrates how a host can read component payloads.",
      mimeType: "application/json"
    },
    async () => {
      return {
        contents: [
          {
            uri: "openlab://component/phy.resistor.axial.basic",
            text: JSON.stringify(getComponent("phy.resistor.axial.basic", "en"), null, 2)
          }
        ]
      };
    }
  );
}

export { registerResources };
