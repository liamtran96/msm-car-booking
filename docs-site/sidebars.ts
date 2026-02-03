import type { SidebarsConfig } from '@docusaurus/plugin-content-docs';

const sidebars: SidebarsConfig = {
  docsSidebar: [
    {
      type: 'doc',
      id: 'implementation-status',
      label: 'Implementation Status',
    },
    {
      type: 'doc',
      id: 'software-requirements-specification',
      label: 'Software Requirements Specification',
    },
    {
      type: 'doc',
      id: 'system-workflows',
      label: 'System Workflows',
    },
    {
      type: 'doc',
      id: 'database-schema',
      label: 'Database Schema',
    },
    {
      type: 'doc',
      id: 'user-guide',
      label: 'User Guide',
    },
    {
      type: 'doc',
      id: 'glossary',
      label: 'Glossary',
    },
    {
      type: 'doc',
      id: 'coding-standards',
      label: 'Coding Standards',
    },
    {
      type: 'category',
      label: 'Architecture',
      link: {
        type: 'doc',
        id: 'architecture/index',
      },
      collapsed: false,
      items: [],
    },
    {
      type: 'category',
      label: 'DevOps',
      link: {
        type: 'doc',
        id: 'devops/index',
      },
      collapsed: false,
      items: [
        'devops/environment-variables',
        'devops/01-docker',
        'devops/02-docker-compose',
        'devops/03-nginx',
        'devops/04-git-workflow',
        'devops/05-cicd-jenkins',
        'devops/06-deployment',
        'devops/07-monitoring',
        'devops/08-vps-deployment-guide',
        'devops/09-prometheus-grafana',
        'devops/prometheus-grafana-setup',
        'devops/cheatsheet',
      ],
    },
    {
      type: 'category',
      label: 'Backend',
      link: {
        type: 'doc',
        id: 'backend/index',
      },
      collapsed: true,
      items: [
        'backend/security',
        'backend/database-setup',
        'backend/vehicle-matching-algorithm',
        'backend/api-documentation',
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
      items: ['frontend/architecture', 'frontend/design-system'],
    },
  ],
};

export default sidebars;
