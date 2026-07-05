// File system types for NEXUS IDE
export interface FileNode {
  id: string;
  name: string;
  path: string;
  type: 'file' | 'folder';
  content?: string;
  language?: string;
  parentId: string | null;
  createdAt: number;
  updatedAt: number;
}

export interface FileTree {
  [id: string]: FileNode;
}

export interface EditorTab {
  id: string;
  fileId: string;
  name: string;
  path: string;
  isDirty: boolean;
  language?: string;
}

export const SUPPORTED_LANGUAGES: Record<string, { name: string; monacoId: string; icon: string }> = {
  html: { name: 'HTML', monacoId: 'html', icon: '🌐' },
  htm: { name: 'HTML', monacoId: 'html', icon: '🌐' },
  css: { name: 'CSS', monacoId: 'css', icon: '🎨' },
  js: { name: 'JavaScript', monacoId: 'javascript', icon: '⚡' },
  jsx: { name: 'React JSX', monacoId: 'javascript', icon: '⚛️' },
  ts: { name: 'TypeScript', monacoId: 'typescript', icon: '🔷' },
  tsx: { name: 'React TSX', monacoId: 'typescript', icon: '⚛️' },
  json: { name: 'JSON', monacoId: 'json', icon: '📋' },
  md: { name: 'Markdown', monacoId: 'markdown', icon: '📝' },
  svg: { name: 'SVG', monacoId: 'xml', icon: '🖼️' },
  xml: { name: 'XML', monacoId: 'xml', icon: '📄' },
  txt: { name: 'Text', monacoId: 'plaintext', icon: '📃' },
};

export function getLanguageFromFilename(filename: string): string {
  const ext = filename.split('.').pop()?.toLowerCase() || '';
  return SUPPORTED_LANGUAGES[ext]?.monacoId || 'plaintext';
}

export function getLanguageIcon(filename: string): string {
  const ext = filename.split('.').pop()?.toLowerCase() || '';
  return SUPPORTED_LANGUAGES[ext]?.icon || '📄';
}

export function generateId(): string {
  return `file_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`;
}
