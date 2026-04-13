import os
import re

def process_file(filepath):
    with open(filepath, 'r', encoding='utf-8') as f:
        content = f.read()

    original = content
    # Replacements
    content = content.replace('#0F766E', '#4F46E5')  # Primary Teal -> Primary Indigo
    content = content.replace('#0F4C45', '#0F172A')  # Dark Sidebar Teal -> Dark Slate
    content = content.replace('bg-[#0F4C45]', 'bg-slate-900') # Hardcoded class handling
    
    # regex for teal-{number} -> indigo-{number}
    content = re.sub(r'teal-(\d{2,3})', r'indigo-\1', content)

    if content != original:
        with open(filepath, 'w', encoding='utf-8') as f:
            f.write(content)
        return True
    return False

def crawl(directory):
    changed_files = 0
    for root, dirs, files in os.walk(directory):
        for file in files:
            if file.endswith(('.tsx', '.ts')):
                filepath = os.path.join(root, file)
                if process_file(filepath):
                    print(f"Updated: {filepath}")
                    changed_files += 1
    print(f"Total files updated: {changed_files}")

if __name__ == "__main__":
    src_dir = os.path.abspath(os.path.join(os.path.dirname(__file__), '../src'))
    crawl(src_dir)
