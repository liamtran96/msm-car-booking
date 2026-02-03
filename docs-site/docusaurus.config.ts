import { themes as prismThemes } from 'prism-react-renderer';
import type { Config } from '@docusaurus/types';
import type * as Preset from '@docusaurus/preset-classic';

const config: Config = {
  title: "MSM-CAR-BOOKING Documentation",
  tagline: "Comprehensive Truck Transport Management System",
  favicon: "img/favicon.ico",

  future: {
    v4: true,
  },

  url: "https://MSM-CAR-BOOKING-docs.vercel.app",
  baseUrl: "/",

  organizationName: "MSM-CAR-BOOKING",
  projectName: "MSM-CAR-BOOKING-docs",

  onBrokenLinks: "throw",

  // English as default with Vietnamese support
  i18n: {
    defaultLocale: "en",
    locales: ["en", "vi"],
    localeConfigs: {
      vi: {
        label: "Tiếng Việt",
        htmlLang: "vi-VN",
      },
      en: {
        label: "English",
        htmlLang: "en-US",
      },
    },
  },

  // Enable Mermaid diagrams
  markdown: {
    mermaid: true,
  },
  themes: ["@docusaurus/theme-mermaid"],

  presets: [
    [
      "classic",
      {
        docs: {
          sidebarPath: "./sidebars.ts",
          showLastUpdateTime: false,
          exclude: [
            '**/node_modules/**',
            '**/pdf-tools/**',
          ],
        },
        blog: {
          showReadingTime: true,
          feedOptions: {
            type: ["rss", "atom"],
            xslt: true,
          },
          blogTitle: "MSM-CAR-BOOKING Blog",
          blogDescription:
            "Updates, announcements, and changelog for MSM-CAR-BOOKING",
          postsPerPage: 10,
          blogSidebarTitle: "Recent posts",
          blogSidebarCount: 5,
          onInlineAuthors: "ignore",
        },
        theme: {
          customCss: "./src/css/custom.css",
        },
      } satisfies Preset.Options,
    ],
  ],

  // Local search plugin
  plugins: [
    [
      "@easyops-cn/docusaurus-search-local",
      {
        hashed: true,
        language: ["en", "vi"],
        highlightSearchTermsOnTargetPage: true,
        explicitSearchResultPath: true,
        docsRouteBasePath: "/docs",
        blogRouteBasePath: "/blog",
        indexDocs: true,
        indexBlog: true,
        indexPages: false,
      },
    ],
  ],

  themeConfig: {
    colorMode: {
      defaultMode: "light",
      disableSwitch: false,
      respectPrefersColorScheme: true,
    },
    docs: {
      sidebar: {
        hideable: true,
        autoCollapseCategories: true,
      },
    },
    navbar: {
      // title: "MSM-CAR-BOOKING",
      logo: {
        alt: "MISUMI Logo",
        src: "img/misumi-main-logo.f015a661.png",
      },
      items: [
        {
          type: "docSidebar",
          sidebarId: "docsSidebar",
          position: "left",
          label: "Documentation",
        },
        { to: "/blog", label: "Blog", position: "left" },
        {
          type: "localeDropdown",
          position: "right",
        },
        {
          href: "https://github.com/MSM-CAR-BOOKING/MSM-CAR-BOOKING",
          label: "GitHub",
          position: "right",
        },
      ],
    },
    footer: {
      style: "dark",
      links: [
        {
          title: "Documentation",
          items: [
            {
              label: "Software Requirements Specification",
              to: "/docs/software-requirements-specification",
            },
            {
              label: "System Workflows",
              to: "/docs/system-workflows",
            },
            {
              label: "Database Schema",
              to: "/docs/database-schema",
            },
          ],
        },
        {
          title: "Development",
          items: [
            {
              label: "DevOps",
              to: "/docs/devops",
            },
            {
              label: "Frontend",
              to: "/docs/frontend/design-system",
            },
            {
              label: "Backend",
              to: "/docs/backend/vehicle-matching-algorithm",
            },
          ],
        },
        {
          title: "More",
          items: [
            {
              label: "Blog",
              to: "/blog",
            },
            {
              label: "GitHub",
              href: "https://github.com/MSM-CAR-BOOKING/MSM-CAR-BOOKING",
            },
          ],
        },
      ],
      copyright: `Copyright © ${new Date().getFullYear()} MSM-CAR-BOOKING. Built with Docusaurus.`,
    },
    prism: {
      theme: prismThemes.github,
      darkTheme: prismThemes.dracula,
      additionalLanguages: [
        "bash",
        "typescript",
        "sql",
        "nginx",
        "docker",
        "yaml",
        "json",
      ],
    },
    mermaid: {
      theme: { light: "neutral", dark: "dark" },
      options: {
        fontSize: 18,
        er: {
          diagramPadding: 40,
          entityPadding: 25,
          useMaxWidth: false,
          minEntityWidth: 140,
          minEntityHeight: 90,
        },
      },
    },
  } satisfies Preset.ThemeConfig,
};

export default config;
