from pathlib import Path


def find_matching_brace(text, start):
    depth = 0
    in_string = None
    escape = False

    for i in range(start, len(text)):
        char = text[i]

        if escape:
            escape = False
            continue

        if char == "\\" and in_string:
            escape = True
            continue

        if char in ('"', "'"):
            if in_string is None:
                in_string = char
            elif in_string == char:
                in_string = None
            continue

        if in_string:
            continue

        if char == "{":
            depth += 1
        elif char == "}":
            depth -= 1

            if depth == 0:
                return i

    return -1


def get_indent(text, position):
    line_start = text.rfind("\n", 0, position) + 1
    return text[line_start:position]


def add_mobile_active(text):
    result = []
    pos = 0
    changed = False

    while True:
        media_start = text.find("@media (hover: hover)", pos)

        if media_start == -1:
            result.append(text[pos:])
            break

        media_brace = text.find("{", media_start)

        if media_brace == -1:
            result.append(text[pos:])
            break

        media_close = find_matching_brace(text, media_brace)

        if media_close == -1:
            result.append(text[pos:])
            break

        media_content = text[media_brace + 1:media_close]

        hover_start = media_content.find("&:hover")

        if hover_start == -1:
            result.append(text[pos:media_close + 1])
            pos = media_close + 1
            continue

        hover_brace = media_content.find("{", hover_start)

        if hover_brace == -1:
            result.append(text[pos:media_close + 1])
            pos = media_close + 1
            continue

        hover_close = find_matching_brace(media_content, hover_brace)

        if hover_close == -1:
            result.append(text[pos:media_close + 1])
            pos = media_close + 1
            continue

        hover_inner = media_content[hover_brace + 1:hover_close]

        media_indent = get_indent(text, media_start)

        # Если перед @media есть пробелы, берём только отступ
        media_indent = media_indent if media_indent.strip() == "" else ""

        active_block = (
            f"\n\n"
            f"{media_indent}@media (hover: none) {{\n"
            f"{media_indent}    &:active {{{hover_inner}"
        )

        if not hover_inner.endswith("\n"):
            active_block += "\n"

        active_block += (
            f"{media_indent}    }}\n"
            f"{media_indent}}}"
        )

        result.append(text[pos:media_close + 1])
        result.append(active_block)

        pos = media_close + 1
        changed = True

    return "".join(result), changed


def process_file(path):
    try:
        text = path.read_text(encoding="utf-8")
    except UnicodeDecodeError:
        print(f"[SKIP] {path} — не UTF-8")
        return

    new_text, changed = add_mobile_active(text)

    if not changed:
        return

    path.write_text(new_text, encoding="utf-8")

    print(f"[OK] {path}")


def main():
    root = Path.cwd()

    files = list(root.rglob("*.scss"))

    print(f"Найдено SCSS файлов: {len(files)}")
    print()

    for path in files:
        process_file(path)

    print()
    print("Готово.")


if __name__ == "__main__":
    main()