---
id: 04-git-workflow
title: Quy trình Git
sidebar_position: 5
---

# Git Workflow - Quản lý phiên bản

**Độ khó:** Người mới bắt đầu
**Thời gian học:** 1-2 giờ
**Yêu cầu:** Kiến thức cơ bản về dòng lệnh

---

## Git là gì?

Git là một **hệ thống quản lý phiên bản phân tán** theo dõi các thay đổi của file theo thời gian. Nó cho phép nhiều developer làm việc trên cùng một codebase mà không xung đột.

### Tại sao sử dụng Git?

| Vấn đề | Giải pháp Git |
|---------|--------------|
| "Tôi làm hỏng gì đó, làm sao hoàn tác?" | Quay lại bất kỳ phiên bản trước đó |
| "Ai đã thay đổi cái này và tại sao?" | Xem lịch sử đầy đủ với blame |
| "Hai người chỉnh sửa cùng một file" | Merge thay đổi thông minh |
| "Tôi cần làm việc trên hai features" | Branching để cách ly |
| "Laptop tôi hỏng" | Code được backup trên remote |

---

## Các khái niệm chính

### Ba vùng

```
┌─────────────────────────────────────────────────────────────┐
│                    Working Directory                         │
│                    (Files thực tế của bạn)                   │
│                                                              │
│    Chỉnh sửa files ở đây                                     │
└─────────────────────────┬───────────────────────────────────┘
                          │ git add
                          ▼
┌─────────────────────────────────────────────────────────────┐
│                    Staging Area (Index)                      │
│                    (Files sẵn sàng commit)                   │
│                                                              │
│    Xem trước những gì sẽ được commit                         │
└─────────────────────────┬───────────────────────────────────┘
                          │ git commit
                          ▼
┌─────────────────────────────────────────────────────────────┐
│                    Repository (.git)                         │
│                    (Lịch sử commit)                          │
│                                                              │
│    Bản ghi vĩnh viễn của tất cả thay đổi                     │
└─────────────────────────────────────────────────────────────┘
```

### Branches

Branches cho phép bạn làm việc trên features mà không ảnh hưởng code chính:

```
main        ●───●───●───●───●───●───●
                    │       ▲
                    │       │ merge
                    ▼       │
feature/auth        ●───●───●
```

---

## Cài đặt Git

### macOS
```bash
# Thường đã cài sẵn, hoặc:
brew install git
```

### Ubuntu/Debian
```bash
sudo apt install git
```

### Windows
Tải từ https://git-scm.com/download/win

### Xác minh cài đặt
```bash
git --version
# git version 2.43.0
```

---

## Thiết lập ban đầu

```bash
# Đặt danh tính của bạn (sử dụng trong commits)
git config --global user.name "Tên của bạn"
git config --global user.email "email@example.com"

# Đặt tên branch mặc định
git config --global init.defaultBranch main

# Đặt editor mặc định
git config --global core.editor "code --wait"  # VS Code

# Xem tất cả cài đặt
git config --list
```

---

## Các lệnh Git cơ bản

### Bắt đầu Repository

```bash
# Tạo repository mới
git init

# Clone repository có sẵn
git clone https://github.com/user/repo.git

# Clone vào thư mục cụ thể
git clone https://github.com/user/repo.git my-folder
```

### Quy trình hàng ngày

```bash
# Kiểm tra status (làm thường xuyên!)
git status

# Xem những gì đã thay đổi
git diff                  # Thay đổi chưa staged
git diff --staged         # Thay đổi đã staged

# Stage files để commit
git add file.txt          # Một file
git add src/              # Thư mục
git add .                 # Tất cả thay đổi
git add -p                # Tương tác (xem xét từng thay đổi)

# Commit thay đổi đã staged
git commit -m "Add user authentication"

# Push lên remote
git push

# Pull thay đổi mới nhất
git pull
```

### Xem lịch sử

```bash
# Xem lịch sử commit
git log

# Log gọn
git log --oneline

# Xem dạng đồ thị
git log --oneline --graph --all

# Hiển thị commit cụ thể
git show abc1234

# Ai đã thay đổi từng dòng
git blame file.txt
```

---

## Branching

### Lệnh Branch

```bash
# Liệt kê branches
git branch              # Branches cục bộ
git branch -r           # Branches remote
git branch -a           # Tất cả branches

# Tạo branch
git branch feature/new-feature

# Chuyển branch
git checkout feature/new-feature
# Hoặc (cú pháp mới)
git switch feature/new-feature

# Tạo và chuyển
git checkout -b feature/new-feature
# Hoặc
git switch -c feature/new-feature

# Xóa branch
git branch -d feature/new-feature    # Xóa an toàn
git branch -D feature/new-feature    # Buộc xóa

# Đổi tên branch hiện tại
git branch -m new-name
```

### Merging

```bash
# Merge branch vào branch hiện tại
git checkout main
git merge feature/new-feature

# Merge không fast-forward (giữ lịch sử branch)
git merge --no-ff feature/new-feature
```

### Merge Conflicts

Khi Git không thể tự động merge:

```
<<<<<<< HEAD
Thay đổi của bạn
=======
Thay đổi của họ
>>>>>>> feature/new-feature
```

Để giải quyết:
1. Chỉnh sửa file để giữ những gì bạn muốn
2. Xóa các dấu conflict markers
3. Stage và commit

```bash
# Sau khi giải quyết conflicts
git add resolved-file.txt
git commit -m "Resolve merge conflict"
```

---

## Chiến lược Branch của chúng tôi

Chúng tôi sử dụng Git Flow đơn giản hóa:

```
main ─────●───────────●───────────●───────────●─── (production)
          │           ▲           ▲
          │           │           │
develop ──●───●───●───●───●───●───●───●───●────── (staging)
              │       ▲       │       ▲
              │       │       │       │
feature/auth ─●───●───●       │       │
                              │       │
feature/trips ────────────────●───●───●
```

### Các loại Branch

| Branch | Mục đích | Tạo từ | Merge vào |
|--------|---------|--------------|-----------|
| `main` | Code production | - | - |
| `develop` | Branch tích hợp | `main` | `main` |
| `feature/*` | Features mới | `develop` | `develop` |
| `bugfix/*` | Sửa lỗi | `develop` | `develop` |
| `hotfix/*` | Sửa lỗi production khẩn cấp | `main` | `main` & `develop` |

### Ví dụ Workflow

```bash
# 1. Bắt đầu feature mới
git checkout develop
git pull origin develop
git checkout -b feature/user-profile

# 2. Làm việc trên feature
# ... thực hiện thay đổi ...
git add .
git commit -m "feat: add user profile page"

# 3. Cập nhật với develop
git checkout develop
git pull origin develop
git checkout feature/user-profile
git merge develop

# 4. Push và tạo PR
git push -u origin feature/user-profile
# Tạo Pull Request trên GitHub/GitLab

# 5. Sau khi PR được approve và merge
git checkout develop
git pull origin develop
git branch -d feature/user-profile
```

---

## Commit Messages

### Conventional Commits

Chúng tôi sử dụng [Conventional Commits](https://www.conventionalcommits.org/):

```
<type>(<scope>): <description>

[optional body]

[optional footer]
```

### Types

| Type | Mô tả | Ví dụ |
|------|-------------|---------|
| `feat` | Feature mới | `feat: add login page` |
| `fix` | Sửa lỗi | `fix: resolve login error` |
| `docs` | Tài liệu | `docs: update API guide` |
| `style` | Định dạng | `style: fix indentation` |
| `refactor` | Tái cấu trúc code | `refactor: extract auth logic` |
| `test` | Thêm/cập nhật tests | `test: add login tests` |
| `chore` | Bảo trì | `chore: update dependencies` |
| `perf` | Hiệu năng | `perf: optimize queries` |
| `ci` | Thay đổi CI/CD | `ci: add GitHub Actions` |

### Viết Commit Messages tốt

**Nên:**
- Sử dụng thể mệnh lệnh ("Add feature" không phải "Added feature")
- Giữ dòng subject dưới 50 ký tự
- Giải thích TẠI SAO, không chỉ CÁI GÌ
- Tham chiếu issues khi có thể

**Không nên:**
- "Fixed stuff"
- "WIP"
- "asdfasdf"

---

## Remote Repositories

### Làm việc với Remotes

```bash
# Liệt kê remotes
git remote -v

# Thêm remote
git remote add origin https://github.com/user/repo.git

# Thay đổi remote URL
git remote set-url origin https://github.com/user/new-repo.git

# Xóa remote
git remote remove origin
```

### Push và Pull

```bash
# Push lên remote
git push origin main

# Push và đặt upstream (lần đầu)
git push -u origin feature/new-feature

# Pull từ remote
git pull origin main

# Fetch mà không merge
git fetch origin
```

---

## Hoàn tác thay đổi

### Hoàn tác thay đổi Working Directory

```bash
# Hủy thay đổi trong file (không thể hoàn tác!)
git checkout -- file.txt
# Hoặc (mới hơn)
git restore file.txt

# Hủy tất cả thay đổi
git checkout -- .
git restore .
```

### Hoàn tác Commits

```bash
# Hoàn tác commit cuối, giữ thay đổi đã staged
git reset --soft HEAD~1

# Hoàn tác commit cuối, giữ thay đổi chưa staged
git reset HEAD~1

# Hoàn tác commit cuối hoàn toàn (mất thay đổi!)
git reset --hard HEAD~1

# Hoàn tác commit cụ thể (tạo commit mới)
git revert abc1234
```

---

## Stashing

Lưu công việc tạm thời mà không commit:

```bash
# Stash thay đổi hiện tại
git stash

# Stash với message
git stash push -m "Work in progress on feature X"

# Liệt kê stashes
git stash list

# Áp dụng stash gần nhất
git stash pop

# Áp dụng stash cụ thể
git stash apply stash@{2}

# Xóa tất cả stashes
git stash clear
```

---

## .gitignore

Nói cho Git biết files nào cần bỏ qua:

```bash
# .gitignore

# Dependencies
node_modules/
vendor/

# Build output
dist/
build/

# Environment files
.env
.env.local
.env.*.local

# IDE files
.idea/
.vscode/

# OS files
.DS_Store
Thumbs.db

# Logs
*.log
logs/

# Secrets
*.pem
*.key
credentials.json
```

---

## Tổng kết

### Lệnh hàng ngày

```bash
git status             # Kiểm tra status
git add .              # Stage thay đổi
git commit -m "msg"    # Commit
git push               # Push lên remote
git pull               # Pull từ remote
```

### Lệnh Branch

```bash
git branch             # Liệt kê branches
git checkout -b name   # Tạo và chuyển
git merge branch       # Merge branch
git branch -d name     # Xóa branch
```

### Lệnh hoàn tác

```bash
git restore file       # Hủy thay đổi
git restore --staged   # Unstage
git reset --soft HEAD~1  # Hoàn tác commit (giữ thay đổi)
git revert abc123      # Hoàn tác commit (commit mới)
```

---

**Tiếp theo:** Học [CI/CD với Jenkins](./05-cicd-jenkins.md) để tự động hóa workflow của bạn.
