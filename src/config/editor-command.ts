const DEFAULT_EDITOR = "cursor";

let editorCommand: string = DEFAULT_EDITOR;
let explicitlySet = false;

export function setEditorCommand(cmd: string): void {
  editorCommand = cmd;
}

export function getEditorCommand(): string {
  return editorCommand;
}

export function setEditorExplicitly(value: boolean): void {
  explicitlySet = value;
}

export function isEditorExplicitlySet(): boolean {
  return explicitlySet;
}

/**
 * Maps MCP client name from the initialize handshake to CLI command.
 * Returns null if no known mapping exists.
 */
export function detectEditorFromClientName(name: string): string | null {
  const lower = name.toLowerCase();
  if (lower.includes("cursor")) {
    return "cursor";
  }
  if (
    lower.includes("vscode") ||
    lower.includes("vs code") ||
    lower.includes("visual studio code")
  ) {
    return "code";
  }
  return null;
}
