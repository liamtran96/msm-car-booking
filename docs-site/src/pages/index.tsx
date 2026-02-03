import type { ReactNode } from 'react';
import Link from '@docusaurus/Link';
import useDocusaurusContext from '@docusaurus/useDocusaurusContext';
import Layout from '@theme/Layout';
import Heading from '@theme/Heading';

import styles from './index.module.css';

function HomepageHeader() {
  const { siteConfig } = useDocusaurusContext();
  return (
    <header className={styles.heroBanner}>
      <div className="container">
        <Heading as="h1" className="hero__title">
          {siteConfig.title}
        </Heading>
        <p className="hero__subtitle">{siteConfig.tagline}</p>
        <div className={styles.buttons}>
          <Link className="button button--primary button--lg" to="/docs/software-requirements-specification">
            Get Started
          </Link>
          <Link
            className="button button--secondary button--lg"
            to="/docs/devops"
          >
            DevOps Guide
          </Link>
        </div>
      </div>
    </header>
  );
}

function FeatureCard({
  title,
  description,
  link,
}: {
  title: string;
  description: string;
  link: string;
}) {
  return (
    <div className={styles.featureCard}>
      <Heading as="h3">{title}</Heading>
      <p>{description}</p>
      <Link to={link}>Learn more →</Link>
    </div>
  );
}

export default function Home(): ReactNode {
  const { siteConfig } = useDocusaurusContext();
  return (
    <Layout title="Home" description={siteConfig.tagline}>
      <HomepageHeader />
      <main className={styles.main}>
        <div className="container">
          <div className={styles.features}>
            <FeatureCard
              title="Software Requirements Specification"
              description="Understand core business processes: orders, trips, fleet management, and cost tracking."
              link="/docs/software-requirements-specification"
            />
            <FeatureCard
              title="System Workflows"
              description="Visual diagrams showing how the car booking system works."
              link="/docs/system-workflows"
            />
            <FeatureCard
              title="DevOps"
              description="Docker, CI/CD, deployment, monitoring, and infrastructure guides."
              link="/docs/devops"
            />
          </div>
        </div>
      </main>
    </Layout>
  );
}
