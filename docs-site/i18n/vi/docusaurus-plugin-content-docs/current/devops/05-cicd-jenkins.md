---
id: 05-cicd-jenkins
title: CI/CD với Jenkins
sidebar_position: 6
---

# CI/CD với Jenkins

**Độ khó:** Trung bình
**Thời gian học:** 2-3 giờ
**Yêu cầu:** [01-docker.md](./01-docker.md), [04-git-workflow.md](./04-git-workflow.md)

---

## CI/CD là gì?

### Continuous Integration (CI)
Tự động build và test code mỗi khi có thay đổi.

### Continuous Delivery/Deployment (CD)
Tự động deploy code đến staging/production.

```
┌──────────────────────────────────────────────────────────────┐
│                     CI/CD Pipeline                            │
│                                                               │
│  Code Push → Build → Test → Deploy to Staging → Production   │
│                                                               │
└──────────────────────────────────────────────────────────────┘
```

---

## Jenkins là gì?

Jenkins là một automation server mã nguồn mở để tự động hóa các tác vụ như build, test, và deploy phần mềm.

### Tại sao Jenkins?

| Ưu điểm | Mô tả |
|---------|-------|
| Mã nguồn mở | Miễn phí sử dụng |
| Plugins phong phú | Hơn 1800+ plugins |
| Pipeline as Code | Jenkinsfile để version control |
| Tích hợp tốt | Docker, Git, Slack, v.v. |

---

## Cài đặt Jenkins

### Sử dụng Docker (Khuyến nghị)

```bash
docker run -d --name jenkins \
  -p 9090:8080 \
  -p 50000:50000 \
  -v jenkins_home:/var/jenkins_home \
  -v /var/run/docker.sock:/var/run/docker.sock \
  jenkins/jenkins:lts

# Lấy password ban đầu
docker exec jenkins cat /var/jenkins_home/secrets/initialAdminPassword
```

Sau đó mở http://localhost:9090 và làm theo hướng dẫn setup.

---

## Pipeline Concepts

### Jenkinsfile

File định nghĩa pipeline, được version control cùng với code.

```groovy
pipeline {
    agent any

    stages {
        stage('Build') {
            steps {
                sh 'npm install'
                sh 'npm run build'
            }
        }
        stage('Test') {
            steps {
                sh 'npm test'
            }
        }
        stage('Deploy') {
            steps {
                sh 'docker compose up -d'
            }
        }
    }
}
```

### Các thành phần

| Thành phần | Mô tả |
|-----------|-------|
| `pipeline` | Container chứa toàn bộ workflow |
| `agent` | Nơi chạy pipeline (any, docker, label) |
| `stages` | Nhóm các stage trong pipeline |
| `stage` | Một phase trong pipeline |
| `steps` | Các bước thực thi trong stage |
| `post` | Các actions sau khi pipeline kết thúc |

---

## Jenkinsfile của dự án

```groovy
pipeline {
    agent any

    environment {
        DOCKER_REGISTRY = 'registry.example.com'
        IMAGE_TAG = "${env.BUILD_NUMBER}"
    }

    stages {
        stage('Checkout') {
            steps {
                checkout scm
            }
        }

        stage('Install Dependencies') {
            steps {
                sh 'npm ci'
            }
        }

        stage('Lint') {
            steps {
                sh 'npm run lint'
            }
        }

        stage('Test') {
            steps {
                sh 'npm run test'
            }
        }

        stage('Build') {
            steps {
                sh 'npm run build'
            }
        }

        stage('Docker Build') {
            when { branch 'main' }
            steps {
                sh 'docker build -t ${DOCKER_REGISTRY}/api:${IMAGE_TAG} .'
            }
        }

        stage('Deploy to Staging') {
            when { branch 'develop' }
            steps {
                sh '''
                    ssh user@staging-server "
                        cd /opt/app &&
                        docker compose pull &&
                        docker compose up -d
                    "
                '''
            }
        }

        stage('Deploy to Production') {
            when { branch 'main' }
            input {
                message "Deploy to production?"
                ok "Deploy"
            }
            steps {
                sh '''
                    ssh user@prod-server "
                        cd /opt/app &&
                        docker compose pull &&
                        docker compose up -d
                    "
                '''
            }
        }
    }

    post {
        always {
            cleanWs()
        }
        success {
            echo 'Pipeline succeeded!'
        }
        failure {
            echo 'Pipeline failed!'
        }
    }
}
```

---

## Webhooks

### Cấu hình GitHub Webhook

1. Vào GitHub repo → Settings → Webhooks
2. Add webhook với URL: `http://jenkins-server:9090/github-webhook/`
3. Content type: `application/json`
4. Secret: (tạo và lưu vào Jenkins credentials)
5. Events: Push, Pull Request

---

## Biến môi trường và Secrets

### Environment Variables

```groovy
environment {
    NODE_ENV = 'production'
    VERSION = "${env.BUILD_NUMBER}"
}
```

### Credentials

```groovy
environment {
    DATABASE_URL = credentials('database-url')
    DOCKER_CREDS = credentials('docker-registry')
}

steps {
    withCredentials([usernamePassword(
        credentialsId: 'docker-registry',
        usernameVariable: 'DOCKER_USER',
        passwordVariable: 'DOCKER_PASS'
    )]) {
        sh 'docker login -u $DOCKER_USER -p $DOCKER_PASS'
    }
}
```

---

## Parallel Stages

```groovy
stage('Parallel Tests') {
    parallel {
        stage('Unit Tests') {
            steps {
                sh 'npm run test:unit'
            }
        }
        stage('Integration Tests') {
            steps {
                sh 'npm run test:integration'
            }
        }
        stage('E2E Tests') {
            steps {
                sh 'npm run test:e2e'
            }
        }
    }
}
```

---

## Notifications

### Slack

```groovy
post {
    success {
        slackSend(
            channel: '#builds',
            color: 'good',
            message: "Build #${env.BUILD_NUMBER} succeeded"
        )
    }
    failure {
        slackSend(
            channel: '#builds',
            color: 'danger',
            message: "Build #${env.BUILD_NUMBER} failed"
        )
    }
}
```

---

## Tổng kết

### CI/CD Flow

```
Push Code → Jenkins Trigger → Build → Test → Deploy
```

### Jenkinsfile Template

```groovy
pipeline {
    agent any

    stages {
        stage('Build') {
            steps { sh 'npm install && npm run build' }
        }
        stage('Test') {
            steps { sh 'npm test' }
        }
        stage('Deploy') {
            when { branch 'main' }
            steps { sh 'docker compose up -d' }
        }
    }

    post {
        always { cleanWs() }
    }
}
```

---

**Tiếp theo:** Học [Deployment](./06-deployment.md) để hiểu các chiến lược deploy.
