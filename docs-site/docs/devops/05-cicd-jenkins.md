---
id: 05-cicd-jenkins
title: CI/CD with Jenkins
sidebar_position: 6
---

# CI/CD with Jenkins

**Difficulty:** Intermediate
**Time to Learn:** 2-3 hours
**Prerequisites:** [01-docker.md](./01-docker.md), [04-git-workflow.md](./04-git-workflow.md)

---

## What is CI/CD?

**CI (Continuous Integration):** Automatically build and test code when developers push changes.

**CD (Continuous Deployment/Delivery):** Automatically deploy tested code to staging or production.

### The CI/CD Pipeline

```
┌─────────┐    ┌─────────┐    ┌─────────┐    ┌─────────┐    ┌─────────┐
│  Code   │───▶│  Build  │───▶│  Test   │───▶│ Package │───▶│ Deploy  │
│  Push   │    │         │    │         │    │         │    │         │
└─────────┘    └─────────┘    └─────────┘    └─────────┘    └─────────┘
     │              │              │              │              │
     ▼              ▼              ▼              ▼              ▼
  Git push    Install deps    Run tests    Docker build   SSH deploy
              Compile code    Linting      Push to        or
                              Coverage     registry       Kubernetes
```

### Why CI/CD?

| Without CI/CD | With CI/CD |
|---------------|------------|
| Manual testing | Automated testing |
| "Works on my machine" | Tested in clean environment |
| Manual deployments | One-click/automatic deploy |
| Deploy fear | Deploy confidence |
| Slow releases | Fast, frequent releases |

---

## What is Jenkins?

Jenkins is an open-source automation server. It's the most popular CI/CD tool.

### Key Features

| Feature | Description |
|---------|-------------|
| **Pipeline as Code** | Define builds in Jenkinsfile |
| **Plugins** | 1800+ plugins for any tool |
| **Distributed Builds** | Scale across multiple machines |
| **Web Interface** | Easy configuration and monitoring |

---

## Jenkins Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                    Jenkins Master                            │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐         │
│  │   Web UI    │  │   Plugins   │  │   Queue     │         │
│  └─────────────┘  └─────────────┘  └─────────────┘         │
│                                                              │
│  ┌─────────────────────────────────────────────────────┐    │
│  │                    Job Scheduler                     │    │
│  └─────────────────────────────────────────────────────┘    │
└─────────────────────────────────────────────────────────────┘
         │                    │                    │
         ▼                    ▼                    ▼
┌─────────────┐      ┌─────────────┐      ┌─────────────┐
│   Agent 1   │      │   Agent 2   │      │   Agent 3   │
│  (builds)   │      │  (builds)   │      │  (builds)   │
└─────────────┘      └─────────────┘      └─────────────┘
```

---

## Running Jenkins Locally

See the detailed instructions below for setting up Jenkins locally.

### Quick Start with Docker

```bash
# Create network
docker network create jenkins

# Run Jenkins
docker run -d --name jenkins \
  --network jenkins \
  -p 9090:8080 \
  -p 50000:50000 \
  -v jenkins_home:/var/jenkins_home \
  -v /var/run/docker.sock:/var/run/docker.sock \
  jenkins/jenkins:lts

# Get initial password
docker exec jenkins cat /var/jenkins_home/secrets/initialAdminPassword

# Open in browser
open http://localhost:9090
```

---

## Understanding Jenkinsfile

A Jenkinsfile defines your pipeline as code, stored in your repository.

### Basic Structure

```groovy
pipeline {
    agent any                           // Where to run

    environment {                        // Environment variables
        APP_NAME = 'myapp'
    }

    stages {                             // Build stages
        stage('Build') {
            steps {
                echo 'Building...'
            }
        }
        stage('Test') {
            steps {
                echo 'Testing...'
            }
        }
    }

    post {                               // After pipeline
        success {
            echo 'Success!'
        }
        failure {
            echo 'Failed!'
        }
    }
}
```

### Our Project's Jenkinsfile Explained

```groovy
pipeline {
    // ===== AGENT =====
    agent any
    // Run on any available Jenkins agent (executor)
    // Other options:
    // agent { docker 'node:20-alpine' }  // Run in Docker
    // agent { label 'linux' }            // Run on specific node

    // ===== ENVIRONMENT =====
    environment {
        DOCKER_REGISTRY = 'registry.gitlab.com/your-group/MSM-CAR-BOOKING-saas-api'
        DOCKER_CREDENTIALS = 'gitlab-registry'  // Jenkins credential ID
    }
    // These are available as $DOCKER_REGISTRY in shell commands
    // Or as env.DOCKER_REGISTRY in Groovy

    // ===== STAGES =====
    stages {
        // ----- CHECKOUT -----
        stage('Checkout') {
            steps {
                checkout scm
                // Clone the repository
                // 'scm' is automatically set when using Pipeline from SCM
            }
        }

        // ----- INSTALL DEPENDENCIES -----
        stage('Install Dependencies') {
            steps {
                sh 'npm install -g pnpm'
                sh 'pnpm install'
                // Run shell commands
                // Each 'sh' starts a new shell
            }
        }

        // ----- LINT -----
        stage('Lint') {
            steps {
                sh 'pnpm run lint'
                // Check code style
                // Fails pipeline if linting errors
            }
        }

        // ----- TEST -----
        stage('Test') {
            steps {
                sh 'pnpm run test'
                // Run test suite
                // Fails pipeline if tests fail
            }
        }

        // ----- BUILD -----
        stage('Build') {
            steps {
                sh 'pnpm run build'
                // Compile TypeScript to JavaScript
                // Creates /dist folder
            }
        }

        // ----- BUILD DOCKER IMAGE -----
        stage('Build Docker Image') {
            when {
                anyOf {
                    branch 'main'
                    branch 'develop'
                }
                // Only run on main or develop branches
            }
            steps {
                script {
                    docker.build("${DOCKER_REGISTRY}:${BUILD_NUMBER}", "-f docker/Dockerfile .")
                    // Build Docker image
                    // Tags with build number (e.g., :42)
                }
            }
        }

        // ----- PUSH DOCKER IMAGE -----
        stage('Push Docker Image') {
            when {
                anyOf {
                    branch 'main'
                    branch 'develop'
                }
            }
            steps {
                script {
                    docker.withRegistry('https://registry.gitlab.com', DOCKER_CREDENTIALS) {
                        docker.image("${DOCKER_REGISTRY}:${BUILD_NUMBER}").push()
                        docker.image("${DOCKER_REGISTRY}:${BUILD_NUMBER}").push('latest')
                    }
                    // Log into registry using stored credentials
                    // Push with build number tag
                    // Also push as 'latest'
                }
            }
        }

        // ----- DEPLOY TO STAGING -----
        stage('Deploy to Staging') {
            when {
                branch 'develop'
                // Only on develop branch
            }
            steps {
                input message: 'Deploy to staging?', ok: 'Deploy'
                // Manual approval step
                // Pipeline pauses here until someone clicks "Deploy"

                sshagent(['staging-ssh-key']) {
                    sh '''
                        ssh -o StrictHostKeyChecking=no $STAGING_USER@$STAGING_HOST << 'EOF'
                            cd /opt/MSM-CAR-BOOKING
                            docker-compose pull api
                            docker-compose up -d api
                        EOF
                    '''
                    // SSH to staging server
                    // Pull new image and restart
                }
            }
        }

        // ----- DEPLOY TO PRODUCTION -----
        stage('Deploy to Production') {
            when {
                branch 'main'
            }
            steps {
                input message: 'Deploy to production?', ok: 'Deploy'
                // Same as staging but for production
                sshagent(['production-ssh-key']) {
                    sh '''
                        ssh -o StrictHostKeyChecking=no $PROD_USER@$PROD_HOST << 'EOF'
                            cd /opt/MSM-CAR-BOOKING
                            docker-compose pull api
                            docker-compose up -d api
                        EOF
                    '''
                }
            }
        }
    }

    // ===== POST ACTIONS =====
    post {
        always {
            cleanWs()
            // Always clean workspace after build
            // Removes cloned files
        }
        success {
            echo 'Pipeline completed successfully!'
            // Could add: Slack notification, email, etc.
        }
        failure {
            echo 'Pipeline failed!'
            // Could add: Alert on-call engineer
        }
    }
}
```

---

## Pipeline Stages Deep Dive

### Conditional Execution (when)

```groovy
stage('Deploy') {
    when {
        // Run only on specific branch
        branch 'main'

        // OR multiple conditions
        anyOf {
            branch 'main'
            branch 'develop'
        }

        // AND conditions
        allOf {
            branch 'main'
            environment name: 'DEPLOY', value: 'true'
        }

        // Expression
        expression { return params.DEPLOY == true }

        // Tag
        tag 'v*'
    }
    steps {
        echo 'Deploying...'
    }
}
```

### Parallel Stages

```groovy
stage('Tests') {
    parallel {
        stage('Unit Tests') {
            steps {
                sh 'pnpm run test:unit'
            }
        }
        stage('Integration Tests') {
            steps {
                sh 'pnpm run test:integration'
            }
        }
        stage('E2E Tests') {
            steps {
                sh 'pnpm run test:e2e'
            }
        }
    }
}
```

### Environment Variables

```groovy
pipeline {
    environment {
        // Global variables
        APP_NAME = 'MSM-CAR-BOOKING'
        DOCKER_IMAGE = "${APP_NAME}:${BUILD_NUMBER}"
    }

    stages {
        stage('Build') {
            environment {
                // Stage-specific variables
                NODE_ENV = 'production'
            }
            steps {
                sh 'echo $APP_NAME'       // Shell variable
                echo "${env.APP_NAME}"    // Groovy variable
            }
        }
    }
}

// Built-in variables:
// BUILD_NUMBER - Current build number
// BUILD_URL - URL to build page
// JOB_NAME - Job name
// WORKSPACE - Workspace directory
// GIT_COMMIT - Git commit hash
// GIT_BRANCH - Git branch name
```

### Credentials

```groovy
pipeline {
    environment {
        // Single credential
        DOCKER_CREDS = credentials('docker-hub-creds')
        // Creates: DOCKER_CREDS_USR and DOCKER_CREDS_PSW

        // Secret text
        API_KEY = credentials('my-api-key')
    }

    stages {
        stage('Login') {
            steps {
                sh 'docker login -u $DOCKER_CREDS_USR -p $DOCKER_CREDS_PSW'
            }
        }
    }
}
```

### Input (Manual Approval)

```groovy
stage('Deploy') {
    steps {
        // Simple approval
        input message: 'Deploy to production?'

        // With options
        input message: 'Deploy to production?',
              ok: 'Deploy Now',
              submitter: 'admin,devops'  // Who can approve

        // With parameters
        script {
            def userInput = input message: 'Select environment',
                parameters: [
                    choice(name: 'ENV', choices: ['staging', 'production'], description: 'Environment')
                ]
            echo "Deploying to ${userInput}"
        }
    }
}
```

### Post Actions

```groovy
post {
    always {
        // Always runs (success or failure)
        cleanWs()
        junit 'reports/*.xml'  // Publish test results
    }
    success {
        // Only on success
        slackSend channel: '#builds', message: 'Build succeeded!'
    }
    failure {
        // Only on failure
        mail to: 'team@example.com',
             subject: "Build Failed: ${env.JOB_NAME}",
             body: "Check: ${env.BUILD_URL}"
    }
    unstable {
        // When tests fail but build succeeds
        echo 'Build unstable'
    }
    changed {
        // When status changed from previous build
        echo 'Build status changed'
    }
}
```

---

## Setting Up Webhooks

Webhooks automatically trigger builds when code is pushed.

### GitHub Webhook

1. Go to repository → Settings → Webhooks
2. Click "Add webhook"
3. Configure:
   - Payload URL: `https://jenkins.example.com/github-webhook/`
   - Content type: `application/json`
   - Events: "Just the push event"

4. In Jenkins job, enable "GitHub hook trigger for GITScm polling"

### GitLab Webhook

1. Go to project → Settings → Webhooks
2. Configure:
   - URL: `https://jenkins.example.com/project/your-job`
   - Secret token: (generate one)
   - Trigger: Push events

3. Install GitLab plugin in Jenkins
4. Enable "Build when a change is pushed to GitLab"

---

## Jenkins Plugins

### Essential Plugins

| Plugin | Purpose |
|--------|---------|
| **Pipeline** | Pipeline as code |
| **Git** | Git integration |
| **NodeJS** | Node.js/npm support |
| **Docker Pipeline** | Docker integration |
| **Credentials** | Secrets management |
| **SSH Agent** | SSH key management |
| **Blue Ocean** | Modern UI |

### Installing Plugins

1. Manage Jenkins → Plugins
2. Available plugins → Search
3. Check box → Install

### Configuring NodeJS Plugin

1. Manage Jenkins → Tools
2. NodeJS installations → Add NodeJS
3. Configure:
   - Name: `NodeJS-20`
   - Install automatically: ✓
   - Version: `20.x`
   - Global npm packages: `pnpm`

---

## Managing Credentials

### Adding Credentials

1. Manage Jenkins → Credentials
2. Click on domain (usually "global")
3. Add Credentials
4. Choose type:

| Type | Use Case |
|------|----------|
| Username with password | Docker Hub, npm |
| SSH Username with private key | Server deployment |
| Secret text | API keys, tokens |
| Secret file | Certificates, key files |

### Using in Pipeline

```groovy
pipeline {
    environment {
        // Username/password
        DOCKER = credentials('docker-hub')
        // Creates: DOCKER_USR, DOCKER_PSW

        // Secret text
        API_KEY = credentials('api-key-id')
    }

    stages {
        stage('Deploy') {
            steps {
                // SSH key
                sshagent(['server-ssh-key']) {
                    sh 'ssh user@server "deploy.sh"'
                }

                // With credentials block
                withCredentials([
                    usernamePassword(
                        credentialsId: 'docker-hub',
                        usernameVariable: 'USER',
                        passwordVariable: 'PASS'
                    )
                ]) {
                    sh 'docker login -u $USER -p $PASS'
                }
            }
        }
    }
}
```

---

## Build Triggers

### Available Triggers

```groovy
pipeline {
    triggers {
        // Poll SCM every 15 minutes
        pollSCM('H/15 * * * *')

        // Build periodically (nightly)
        cron('H 0 * * *')

        // GitHub webhook (automatic)
        githubPush()

        // Upstream job
        upstream(upstreamProjects: 'other-job', threshold: hudson.model.Result.SUCCESS)
    }
}
```

### Cron Syntax

```
┌─────── minute (0 - 59)
│ ┌────── hour (0 - 23)
│ │ ┌───── day of month (1 - 31)
│ │ │ ┌──── month (1 - 12)
│ │ │ │ ┌─── day of week (0 - 7)
│ │ │ │ │
* * * * *
```

| Expression | Meaning |
|------------|---------|
| `H * * * *` | Every hour |
| `H/15 * * * *` | Every 15 minutes |
| `H 0 * * *` | Daily at midnight |
| `H 0 * * 1-5` | Weekdays at midnight |

The `H` symbol spreads load across the hour (not all jobs at :00).

---

## 🔧 Hands-On Exercises

### Exercise 1: Create Your First Pipeline

1. Open Jenkins: http://localhost:9090
2. Click "New Item"
3. Name: `hello-pipeline`, Type: Pipeline
4. In Pipeline section, select "Pipeline script"
5. Enter:

```groovy
pipeline {
    agent any
    stages {
        stage('Hello') {
            steps {
                echo 'Hello, Jenkins!'
            }
        }
        stage('Date') {
            steps {
                sh 'date'
            }
        }
    }
}
```

6. Click Save, then Build Now
7. Check Console Output

### Exercise 2: Build Node.js Project

```groovy
pipeline {
    agent any

    stages {
        stage('Checkout') {
            steps {
                git url: 'https://github.com/your-org/your-repo.git',
                    branch: 'main'
            }
        }

        stage('Install') {
            steps {
                sh 'npm install'
            }
        }

        stage('Test') {
            steps {
                sh 'npm test'
            }
        }

        stage('Build') {
            steps {
                sh 'npm run build'
            }
        }
    }

    post {
        always {
            cleanWs()
        }
    }
}
```

---

## Troubleshooting

### Build Stuck on Agent

```groovy
// Add timeout
options {
    timeout(time: 1, unit: 'HOURS')
}
```

### Permission Denied for Docker

```bash
# Inside Jenkins container
docker exec -u root jenkins chmod 666 /var/run/docker.sock
```

### Credentials Not Found

1. Check credential ID matches exactly
2. Check credential scope (global vs folder)
3. Verify credential exists in Jenkins

### Script Approval Required

1. Manage Jenkins → In-process Script Approval
2. Approve pending scripts

### Pipeline Syntax Errors

Use the Pipeline Syntax generator:
1. Open job → Pipeline Syntax
2. Select step → Configure → Generate
3. Copy generated code

---

## Best Practices

### 1. Keep Pipelines Simple

```groovy
// ❌ Complex logic in Jenkinsfile
stage('Deploy') {
    steps {
        script {
            if (env.BRANCH_NAME == 'main') {
                // 50 lines of Groovy...
            }
        }
    }
}

// ✅ Use scripts/deploy.sh
stage('Deploy') {
    steps {
        sh './scripts/deploy.sh'
    }
}
```

### 2. Fail Fast

```groovy
options {
    skipDefaultCheckout()
    timeout(time: 30, unit: 'MINUTES')
}
```

### 3. Archive Artifacts

```groovy
post {
    success {
        archiveArtifacts artifacts: 'dist/**/*', fingerprint: true
    }
}
```

### 4. Use Shared Libraries

For common code across pipelines:
```groovy
@Library('my-shared-library') _

pipeline {
    stages {
        stage('Deploy') {
            steps {
                deployToServer('staging')  // From shared library
            }
        }
    }
}
```

---

## Summary

| Concept | Purpose |
|---------|---------|
| **Jenkinsfile** | Pipeline as code |
| **stage** | Build phase |
| **steps** | Commands to run |
| **when** | Conditional execution |
| **post** | After-build actions |
| **credentials** | Secrets management |
| **input** | Manual approval |

### Pipeline Flow

```
Push → Webhook → Jenkins → Build → Test → Deploy
                    ↓
                 Success?
                  ↙   ↘
               Yes     No
                ↓       ↓
            Deploy   Alert
```

---

**Next:** Learn [Deployment Strategies](./06-deployment.md) for going to production.
