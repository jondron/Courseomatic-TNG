import sys

def find_matching_bracket(text, start):
    stack = []
    for i, char in enumerate(text[start:], start):
        if char == '{':
            stack.append(char)
        elif char == '}':
            if stack:
                stack.pop()
            if not stack:
                return i
    return -1

def extract_functions(content):
    functions = []
    i = 0
    while i < len(content):
        if content.startswith('function', i):
            start = i
            name_start = i + 8  # 'function' length
            while content[name_start].isspace():
                name_start += 1
            name_end = content.find('(', name_start)
            if name_end == -1:
                i += 1
                continue
            func_name = content[name_start:name_end].strip()
            
            body_start = content.find('{', name_end)
            if body_start == -1:
                i += 1
                continue
            
            body_end = find_matching_bracket(content, body_start)
            if body_end == -1:
                i += 1
                continue
            
            func_body = content[body_start:body_end+1]
            functions.append((start, body_end+1, func_name, func_body))
            i = body_end + 1
        else:
            i += 1
    return functions

def remove_duplicate_functions(file_path):
    with open(file_path, 'r') as file:
        content = file.read()

    functions = extract_functions(content)
    unique_functions = {}
    to_remove = []

    for start, end, name, body in functions:
        normalized_body = ' '.join(body.split())
        if name in unique_functions:
            if normalized_body != ' '.join(unique_functions[name][3].split()):
                continue
            to_remove.append((start, end))
        else:
            unique_functions[name] = (start, end, name, body)

    # Remove duplicates from the end to avoid shifting indices
    for start, end in sorted(to_remove, reverse=True):
        content = content[:start] + content[end:]

    with open(file_path, 'w') as file:
        file.write(content)

    print(f"Duplicate functions removed from {file_path}")

if __name__ == "__main__":
    if len(sys.argv) != 2:
        print("Usage: python script_name.py <path_to_js_file>")
        sys.exit(1)

    js_file_path = sys.argv[1]
    remove_duplicate_functions(js_file_path)
