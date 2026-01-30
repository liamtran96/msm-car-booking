import type { SidebarsConfig } from '@docusaurus/plugin-content-docs';

const sidebars: SidebarsConfig = {
  docsSidebar: [
    {
      type: 'doc',
      id: 'intro',
      label: 'Introduction',
    },
    {
      type: 'doc',
      id: 'business-flows',
      label: 'Business Flows',
    },
    {
      type: 'doc',
      id: 'database-reference',
      label: 'Database Reference',
    },
    {
      type: 'category',
      label: 'Architecture',
      link: {
        type: 'doc',
        id: 'architecture/index',
      },
      collapsed: false,
      items: [
        'architecture/01-system-design',
        'architecture/02-backend-architecture',
        'architecture/03-frontend-architecture',
        'architecture/04-database-design',
        'architecture/05-devops-infrastructure',
        'architecture/06-monitoring-observability',
        'architecture/07-security',
        'architecture/08-multi-tenant-saas',
        'architecture/09-high-concurrency-scaling',
        'architecture/10-tenant-visual-guide',
      ],
    },
    {
      type: 'category',
      label: 'DevOps',
      link: {
        type: 'doc',
        id: 'devops/index',
      },
      collapsed: true,
      items: [
        'devops/01-docker',
        'devops/02-docker-compose',
        'devops/03-nginx',
        'devops/04-git-workflow',
        'devops/05-cicd-jenkins',
        'devops/06-deployment',
        'devops/07-monitoring',
        'devops/09-prometheus-grafana',
        'devops/prometheus-grafana-setup',
        'devops/cheatsheet',
      ],
    },
    {
      type: 'category',
      label: 'Backend (NestJS)',
      link: {
        type: 'doc',
        id: 'backend/backend-index',
      },
      collapsed: true,
      items: [
        'backend/request-lifecycle',
        'backend/modules-dependency-injection',
        'backend/controllers-routes',
        'backend/services-business-logic',
        'backend/guards-authentication',
        'backend/dtos-validation',
        'backend/database-typeorm',
        'backend/error-handling',
        'backend/multi-tenancy',
        'backend/testing',
      ],
    },
    {
      type: 'category',
      label: 'Frontend',
      link: {
        type: 'doc',
        id: 'frontend/index',
      },
      collapsed: true,
      items: ['frontend/structure', 'frontend/design-system'],
    },
  ],
};

export default sidebars;
