import re
import base64
import requests
from backend.config import GITHUB_TOKEN
from backend.utils.file_filters import is_safe_code_file


def parse_repo(repo_url: str):
    clean = repo_url.rstrip("/").removesuffix(".git")
    match = re.search(r"github\.com[:/]([\w-]+)/([\w.-]+)", clean)
    return match.groups() if match else None


def fetch_repo_files(repo_url: str):
    repo_info = parse_repo(repo_url)
    if not repo_info:
        raise ValueError("Invalid GitHub repository URL")

    owner, repo = repo_info

    headers = {
        "Authorization": f"token {GITHUB_TOKEN}",
        "Accept": "application/vnd.github.v3+json",
    }

    # ✅ 1) Repo metadata
    meta_resp = requests.get(f"https://api.github.com/repos/{owner}/{repo}", headers=headers)
    meta_resp.raise_for_status()
    branch = meta_resp.json().get("default_branch", "main")

    # ✅ 2) Get commit SHA of branch
    ref_resp = requests.get(
        f"https://api.github.com/repos/{owner}/{repo}/git/ref/heads/{branch}",
        headers=headers
    )
    ref_resp.raise_for_status()
    commit_sha = ref_resp.json()["object"]["sha"]

    # ✅ 3) Get tree SHA from commit
    commit_resp = requests.get(
        f"https://api.github.com/repos/{owner}/{repo}/git/commits/{commit_sha}",
        headers=headers
    )
    commit_resp.raise_for_status()
    tree_sha = commit_resp.json()["tree"]["sha"]

    # ✅ 4) Get recursive tree using tree SHA
    tree_resp = requests.get(
        f"https://api.github.com/repos/{owner}/{repo}/git/trees/{tree_sha}?recursive=1",
        headers=headers
    )
    tree_resp.raise_for_status()
    tree_data = tree_resp.json()

    result_files = []

    for item in tree_data.get("tree", []):
        if item.get("type") != "blob":
            continue

        path = item.get("path", "")
        sha = item.get("sha")

        if not is_safe_code_file(path):
            continue

        blob_resp = requests.get(
            f"https://api.github.com/repos/{owner}/{repo}/git/blobs/{sha}",
            headers=headers
        )
        if blob_resp.status_code != 200:
            continue

        blob = blob_resp.json()
        if blob.get("encoding") != "base64":
            continue

        raw = base64.b64decode(blob["content"])
        content = raw.decode("utf-8", errors="ignore")

        result_files.append({"path": path, "content": content})

    return result_files
