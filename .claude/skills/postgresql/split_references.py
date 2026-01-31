#!/usr/bin/env python3
"""
Split PostgreSQL reference files into smaller topic-based files.
Target: Each file under 400 lines.
"""

import re
import os
from pathlib import Path
from collections import defaultdict
from dataclasses import dataclass, field
from typing import Optional

MAX_LINES = 400
REFS_DIR = Path(__file__).parent / "references"

# Topic mappings: chapter prefix -> topic name
TOPIC_MAPPINGS = {
    # PL/pgSQL
    "41": "plpgsql",
    # SQL syntax
    "4": "sql-syntax",
    # Data types
    "8": "data-types",
    "10": "type-conversion",
    # Functions (large, will be split)
    "9": "functions",
    # Data definition
    "5": "data-definition",
    # Queries
    "6": "queries",
    "7": "queries",
    # Indexes
    "11": "indexes",
    "65": "indexes",
    # Full text search
    "12": "full-text-search",
    # Transactions and concurrency
    "13": "transactions",
    "67": "transactions",
    # Performance
    "14": "performance",
    "15": "performance",
    # Admin chapters
    "19": "server-config",
    "20": "authentication",
    "21": "roles",
    "22": "roles",
    "23": "localization",
    "24": "maintenance",
    # Backup and recovery
    "25": "backup",
    "28": "wal",
    "70": "backup",
    # Replication
    "26": "replication",
    "29": "replication",
    # Monitoring
    "27": "monitoring",
    # System catalogs
    "52": "system-catalogs",
    "53": "system-views",
    # Information schema
    "35": "info-schema",
    # Triggers and events
    "37": "triggers",
    "38": "event-triggers",
    # Extending PostgreSQL
    "36": "extending",
    "39": "rules",
    # Client libraries
    "32": "libpq",
    "33": "large-objects",
    "34": "ecpg",
    # Procedural languages
    "40": "proc-languages",
    "42": "pltcl",
    "43": "plperl",
    "44": "plpython",
    "45": "spi",
    # Protocol
    "54": "protocol",
    "55": "protocol",
    # Logical decoding/replication
    "47": "logical-decoding",
    "48": "logical-decoding",
    "49": "logical-decoding",
    "50": "oauth",
    # Internals
    "51": "internals",
    "56": "internals",
    "57": "internals",
    "58": "internals",
    "59": "internals",
    "60": "internals",
    "61": "internals",
    "62": "internals",
    "63": "index-access",
    "64": "index-access",
    "66": "storage",
    "68": "bki",
    "69": "planner-stats",
    # Getting started chapters
    "1": "getting-started",
    "2": "tutorial",
    "3": "advanced-tutorial",
    "16": "installation-binary",
    "17": "installation-source",
    "18": "server-operation",
    "31": "regression-tests",
}

# Appendix mappings
APPENDIX_MAPPINGS = {
    "A": "appendix-error-codes",
    "B": "appendix-datetime",
    "C": "appendix-keywords",
    "D": "appendix-sql-conformance",
    "E": "appendix-release-notes",
    "F": "contrib-modules",
    "G": "contrib-programs",
    "H": "appendix-external",
    "I": "appendix-source-repos",
    "J": "appendix-documentation",
    "K": "appendix-limits",
    "L": "appendix-acronyms",
    "M": "appendix-glossary",
    "N": "appendix-color",
    "O": "appendix-obsolete",
}


@dataclass
class Section:
    """A markdown section with header and content."""
    header: str
    content: str
    chapter: Optional[str] = None
    section_num: Optional[str] = None
    url: Optional[str] = None

    @property
    def line_count(self) -> int:
        return self.content.count('\n') + 1

    def get_topic(self) -> str:
        """Determine the topic for this section."""
        if self.chapter:
            # Check numeric chapters
            if self.chapter in TOPIC_MAPPINGS:
                return TOPIC_MAPPINGS[self.chapter]
            # Check appendices
            if self.chapter in APPENDIX_MAPPINGS:
                return APPENDIX_MAPPINGS[self.chapter]

        # Check header for appendix patterns
        header_lower = self.header.lower()
        if "appendix" in header_lower:
            for letter, topic in APPENDIX_MAPPINGS.items():
                if f"appendix {letter.lower()}" in header_lower:
                    return topic

        # Check for special sections
        if "preface" in header_lower:
            return "preface"
        if "client applications" in header_lower:
            return "client-apps"
        if "server applications" in header_lower:
            return "server-apps"
        if "part " in header_lower:
            return "overview"

        # Check URL patterns for SQL commands (blank headers often have SQL command docs)
        if self.url:
            url_lower = self.url.lower()
            # SQL commands: /docs/18/sql-xxx.html
            if "/sql-" in url_lower:
                return "sql-commands"
            # App commands: /docs/18/app-xxx.html
            if "/app-" in url_lower:
                return "client-apps"
            # Catalog pages
            if "/catalog-" in url_lower:
                return "system-catalogs"
            # View pages
            if "/view-" in url_lower:
                return "system-views"
            # Functions
            if "/functions-" in url_lower:
                return "functions"
            # Data types
            if "/datatype-" in url_lower:
                return "data-types"
            # Indexes
            if "/indexes-" in url_lower:
                return "indexes"
            # GIN/GiST/etc index types
            if any(x in url_lower for x in ["/gin", "/gist", "/brin", "/spgist", "/btree"]):
                return "index-access"
            # ECPG
            if "/ecpg-" in url_lower:
                return "ecpg"
            # libpq
            if "/libpq-" in url_lower:
                return "libpq"
            # Full text search
            if "/textsearch" in url_lower:
                return "full-text-search"
            # Logical replication
            if "/logical-replication" in url_lower:
                return "replication"
            # Streaming replication
            if "/warm-standby" in url_lower or "/high-availability" in url_lower:
                return "replication"
            # Config
            if "/runtime-config" in url_lower:
                return "server-config"
            # Auth
            if "/auth-" in url_lower or "/client-authentication" in url_lower:
                return "authentication"
            # DDL
            if "/ddl-" in url_lower:
                return "data-definition"
            # Queries/DML
            if "/queries-" in url_lower or "/dml-" in url_lower:
                return "queries"
            # Transactions
            if "/mvcc" in url_lower or "/transaction-" in url_lower:
                return "transactions"
            # Performance
            if "/performance-" in url_lower or "/parallel-" in url_lower:
                return "performance"
            # PL/pgSQL
            if "/plpgsql-" in url_lower:
                return "plpgsql"
            # Triggers
            if "/trigger-" in url_lower:
                return "triggers"
            # Rules
            if "/rules-" in url_lower:
                return "rules"
            # Backup
            if "/backup" in url_lower or "/continuous-archiving" in url_lower:
                return "backup"
            # WAL
            if "/wal-" in url_lower:
                return "wal"
            # Monitoring
            if "/monitoring-" in url_lower:
                return "monitoring"
            # Server admin
            if "/server-" in url_lower:
                return "server-operation"
            # Roles
            if "/role-" in url_lower or "/user-" in url_lower or "/privileges" in url_lower:
                return "roles"
            # Type conversion
            if "/typeconv-" in url_lower:
                return "type-conversion"
            # Localization
            if "/locale" in url_lower or "/collation" in url_lower or "/charset" in url_lower:
                return "localization"

        return "misc"


def parse_chapter_section(header: str) -> tuple[Optional[str], Optional[str]]:
    """Extract chapter and section numbers from a header."""
    # Pattern for numbered sections: "## 41.1. Overview #"
    match = re.match(r'##\s+(\d+)\.(\d+(?:\.\d+)*)\.?\s+', header)
    if match:
        return match.group(1), f"{match.group(1)}.{match.group(2)}"

    # Pattern for chapter headers: "## Chapter 31. Regression Tests"
    match = re.match(r'##\s+Chapter\s+(\d+)\.', header)
    if match:
        return match.group(1), None

    # Pattern for appendix sections: "## F.14. earthdistance..."
    match = re.match(r'##\s+([A-Z])\.(\d+(?:\.\d+)*)\.?\s+', header)
    if match:
        return match.group(1), f"{match.group(1)}.{match.group(2)}"

    # Pattern for appendix headers: "## Appendix F. Additional..."
    match = re.match(r'##\s+Appendix\s+([A-Z])\.', header)
    if match:
        return match.group(1), None

    return None, None


def extract_url(content: str) -> Optional[str]:
    """Extract URL from section content."""
    match = re.search(r'\*\*URL:\*\*\s*(https?://[^\s]+)', content)
    if match:
        return match.group(1)
    return None


def parse_markdown_sections(content: str) -> list[Section]:
    """Parse markdown content into sections."""
    sections = []

    # Split by ## headers
    parts = re.split(r'(^## .*$)', content, flags=re.MULTILINE)

    current_header = None
    current_content = []

    for part in parts:
        if part.startswith('## '):
            # Save previous section
            if current_header is not None:
                content_str = '\n'.join(current_content)
                chapter, section_num = parse_chapter_section(current_header)
                url = extract_url(content_str)
                sections.append(Section(
                    header=current_header,
                    content=content_str,
                    chapter=chapter,
                    section_num=section_num,
                    url=url
                ))
            current_header = part
            current_content = []
        else:
            current_content.append(part)

    # Save last section
    if current_header is not None:
        content_str = '\n'.join(current_content)
        chapter, section_num = parse_chapter_section(current_header)
        url = extract_url(content_str)
        sections.append(Section(
            header=current_header,
            content=content_str,
            chapter=chapter,
            section_num=section_num,
            url=url
        ))

    return sections


def group_sections_by_topic(sections: list[Section]) -> dict[str, list[Section]]:
    """Group sections by their topic."""
    topics = defaultdict(list)
    for section in sections:
        topic = section.get_topic()
        topics[topic].append(section)
    return dict(topics)


def split_large_section(section: Section, max_lines: int) -> list[str]:
    """Split a large section into smaller chunks, respecting line boundaries."""
    section_content = f"{section.header}\n{section.content}\n---\n\n"
    total_lines = section_content.count('\n')

    if total_lines <= max_lines:
        return [section_content]

    header = section.header
    content = section.content
    lines = content.split('\n')

    chunks = []
    current_lines = [header]
    current_count = 1  # header line
    target = max_lines - 20  # Leave room for header/footer/combination

    for line in lines:
        if current_count >= target and len(current_lines) > 1:
            # Save current chunk
            chunk_content = '\n'.join(current_lines) + '\n\n*(continued...)*\n---\n\n'
            chunks.append(chunk_content)
            # Start new chunk with continuation header
            cont_header = f"{header} (continued)"
            current_lines = [cont_header, line]
            current_count = 2
        else:
            current_lines.append(line)
            current_count += 1

    # Save final chunk
    if current_lines:
        chunk_content = '\n'.join(current_lines) + '\n---\n\n'
        chunks.append(chunk_content)

    return chunks


def split_topic_into_files(topic: str, sections: list[Section]) -> list[tuple[str, str]]:
    """Split a topic's sections into files, each under MAX_LINES."""
    files = []
    current_lines = []
    current_count = 2  # Account for file header (2 lines)
    file_num = 1
    file_target = MAX_LINES - 5  # Buffer for safety

    # Header for each file
    def make_header(num: int) -> str:
        suffix = f"-{num}" if num > 1 else ""
        return f"# PostgreSQL - {topic.replace('-', ' ').title()}{' (Part ' + str(num) + ')' if num > 1 else ''}\n\n"

    for section in sections:
        # Split large sections into smaller chunks
        section_chunks = split_large_section(section, file_target)

        for chunk in section_chunks:
            chunk_lines = chunk.count('\n')

            if current_count + chunk_lines > file_target and current_lines:
                # Save current file
                filename = f"{topic}{'-' + str(file_num) if file_num > 1 else ''}.md"
                content = make_header(file_num) + ''.join(current_lines)
                files.append((filename, content))

                # Start new file
                file_num += 1
                current_lines = []
                current_count = 2  # Account for file header

            current_lines.append(chunk)
            current_count += chunk_lines

    # Save remaining content
    if current_lines:
        filename = f"{topic}{'-' + str(file_num) if file_num > 1 else ''}.md"
        content = make_header(file_num) + ''.join(current_lines)
        files.append((filename, content))

    return files


def process_file(filepath: Path) -> dict[str, list[Section]]:
    """Process a markdown file and return sections grouped by topic."""
    print(f"Processing {filepath.name}...")
    content = filepath.read_text(encoding='utf-8')

    # Skip the header (first few lines with metadata)
    lines = content.split('\n')
    start_idx = 0
    for i, line in enumerate(lines):
        if line.startswith('---') and i > 0:
            start_idx = i + 1
            break

    content = '\n'.join(lines[start_idx:])
    sections = parse_markdown_sections(content)
    print(f"  Found {len(sections)} sections")

    return group_sections_by_topic(sections)


def main():
    """Main entry point."""
    print("PostgreSQL Reference Splitter")
    print("=" * 50)

    sql_file = REFS_DIR / "sql.md"
    getting_started_file = REFS_DIR / "getting_started.md"

    # Collect all sections from both files
    all_topics: dict[str, list[Section]] = defaultdict(list)

    if sql_file.exists():
        topics = process_file(sql_file)
        for topic, sections in topics.items():
            all_topics[topic].extend(sections)

    if getting_started_file.exists():
        topics = process_file(getting_started_file)
        for topic, sections in topics.items():
            all_topics[topic].extend(sections)

    print(f"\nFound {len(all_topics)} topics:")
    for topic, sections in sorted(all_topics.items()):
        total_lines = sum(s.line_count for s in sections)
        print(f"  {topic}: {len(sections)} sections, ~{total_lines} lines")

    # Generate output files
    print("\nGenerating output files...")
    output_files = []

    for topic, sections in all_topics.items():
        files = split_topic_into_files(topic, sections)
        output_files.extend(files)
        for filename, _ in files:
            print(f"  {filename}")

    # Write files
    print("\nWriting files...")
    for filename, content in output_files:
        filepath = REFS_DIR / filename
        filepath.write_text(content, encoding='utf-8')
    print(f"  Written {len(output_files)} files")

    # Generate index file
    print("\nGenerating index.md...")
    generate_index(output_files)

    print("\nDone!")
    print(f"Generated {len(output_files)} topic files")

    print("\nPostgreSQL skill ready in references/")


def generate_index(output_files: list[tuple[str, str]]):
    """Generate the index.md file with categorized links."""
    categories = {
        "Getting Started": ["getting-started", "tutorial", "advanced-tutorial", "installation-binary", "installation-source", "server-operation", "regression-tests"],
        "SQL Language": ["sql-syntax", "sql-commands", "data-types", "type-conversion", "functions", "queries", "data-definition"],
        "Server Administration": ["server-config", "authentication", "roles", "localization", "maintenance", "monitoring"],
        "Backup & Recovery": ["backup", "wal"],
        "Replication": ["replication", "logical-decoding"],
        "Performance": ["performance", "indexes", "full-text-search", "planner-stats"],
        "Transactions": ["transactions"],
        "Triggers & Rules": ["triggers", "event-triggers", "rules"],
        "System Catalogs": ["system-catalogs", "system-views", "info-schema"],
        "Procedural Languages": ["plpgsql", "pltcl", "plperl", "plpython", "proc-languages"],
        "Client Libraries": ["libpq", "large-objects", "ecpg", "client-apps"],
        "Extending PostgreSQL": ["extending", "spi", "index-access"],
        "Internals": ["internals", "storage", "bki", "protocol", "oauth"],
        "Server Applications": ["server-apps"],
        "Appendices": ["appendix-error-codes", "appendix-datetime", "appendix-keywords", "appendix-sql-conformance", "appendix-release-notes", "appendix-external", "appendix-source-repos", "appendix-documentation", "appendix-limits", "appendix-acronyms", "appendix-glossary", "appendix-color", "appendix-obsolete"],
        "Contrib Modules": ["contrib-modules", "contrib-programs"],
        "Other": ["preface", "overview", "misc"],
    }

    # Build file lookup
    file_lookup = {}
    for filename, _ in output_files:
        # Extract topic from filename
        base = filename.replace('.md', '')
        # Handle numbered parts
        if '-' in base and base.split('-')[-1].isdigit():
            topic = '-'.join(base.split('-')[:-1])
        else:
            topic = base

        if topic not in file_lookup:
            file_lookup[topic] = []
        file_lookup[topic].append(filename)

    # Generate index content
    lines = [
        "# PostgreSQL Documentation Index",
        "",
        "Comprehensive PostgreSQL 18 documentation organized by topic.",
        "",
    ]

    for category, topics in categories.items():
        category_files = []
        for topic in topics:
            if topic in file_lookup:
                category_files.extend(sorted(file_lookup[topic]))

        if category_files:
            lines.append(f"## {category}")
            lines.append("")
            for filename in category_files:
                display_name = filename.replace('.md', '').replace('-', ' ').title()
                lines.append(f"- [{display_name}]({filename})")
            lines.append("")

    # Write index
    index_path = REFS_DIR / "index.md"
    index_path.write_text('\n'.join(lines), encoding='utf-8')
    print(f"  index.md: {len(lines)} lines")


if __name__ == "__main__":
    main()
