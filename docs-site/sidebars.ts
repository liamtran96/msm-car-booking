import type { SidebarsConfig } from '@docusaurus/plugin-content-docs';

const sidebars: SidebarsConfig = {
  docsSidebar: [
    {
      type: 'doc',
      id: 'business-flows',
      label: 'Business Flows',
    },
    {
      type: 'doc',
      id: 'system-workflows',
      label: 'System Workflows',
    },
    {
      type: 'doc',
      id: 'database-models',
      label: 'Database Models',
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
      items: ['frontend/design-system'],
    },
  ],
};

export default sidebars;
