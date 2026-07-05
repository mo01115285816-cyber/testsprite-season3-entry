// IndexedDB setup for NEXUS file system
import { openDB, type DBSchema, type IDBPDatabase } from 'idb';
import type { FileNode } from './types';

interface NexusFSDatabase extends DBSchema {
  files: {
    key: string;
    value: FileNode;
    indexes: { 'by-parent': string; 'by-path': string };
  };
  settings: {
    key: string;
    value: { key: string; value: unknown };
  };
}

const DB_NAME = 'nexus-fs';
const DB_VERSION = 1;

let dbPromise: Promise<IDBPDatabase<NexusFSDatabase>> | null = null;

export function getDB(): Promise<IDBPDatabase<NexusFSDatabase>> {
  if (!dbPromise) {
    dbPromise = openDB<NexusFSDatabase>(DB_NAME, DB_VERSION, {
      upgrade(db) {
        if (!db.objectStoreNames.contains('files')) {
          const filesStore = db.createObjectStore('files', { keyPath: 'id' });
          filesStore.createIndex('by-parent', 'parentId');
          filesStore.createIndex('by-path', 'path');
        }
        if (!db.objectStoreNames.contains('settings')) {
          db.createObjectStore('settings', { keyPath: 'key' });
        }
      },
    });
  }
  return dbPromise;
}

// Seed default files on first run
const DEFAULT_FILES = [
  {
    id: 'root_index',
    name: 'index.html',
    path: '/index.html',
    type: 'file' as const,
    parentId: null,
    language: 'html',
    content: `<!DOCTYPE html>
<html lang="ar" dir="rtl">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>NEXUS — تجربة الكود</title>
    <style>
        body {
            font-family: system-ui, -apple-system, sans-serif;
            background-color: #f0fdf4;
            color: #14532d;
            display: flex;
            flex-direction: column;
            align-items: center;
            justify-content: center;
            height: 100vh;
            margin: 0;
        }
        .container {
            background-color: white;
            padding: 2.5rem;
            border-radius: 1.5rem;
            box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.05);
            text-align: center;
            max-width: 450px;
            width: 90%;
        }
        h1 { margin-top: 0; color: #166534; font-size: 1.75rem; font-weight: 800; }
        button {
            background-color: #22c55e;
            color: white;
            border: none;
            padding: 0.85rem 2rem;
            border-radius: 0.75rem;
            font-size: 0.95rem;
            font-weight: 600;
            cursor: pointer;
        }
    </style>
</head>
<body>
    <div class="container">
        <h1>مرحباً بك في NEXUS!</h1>
        <button onclick="alert('الكود يعمل!')">اضغط للتجربة</button>
    </div>
</body>
</html>`,
    createdAt: Date.now(),
    updatedAt: Date.now(),
  },
  {
    id: 'root_style',
    name: 'style.css',
    path: '/style.css',
    type: 'file' as const,
    parentId: null,
    language: 'css',
    content: `/* NEXUS — Stylesheet */
body {
  margin: 0;
  font-family: system-ui, sans-serif;
  background: #0f0f0f;
  color: #f8f8f8;
}`,
    createdAt: Date.now(),
    updatedAt: Date.now(),
  },
  {
    id: 'root_app',
    name: 'app.js',
    path: '/app.js',
    type: 'file' as const,
    parentId: null,
    language: 'javascript',
    content: `// NEXUS — JavaScript
console.log('Hello from NEXUS!');`,
    createdAt: Date.now(),
    updatedAt: Date.now(),
  },
];

export async function seedDefaultFiles(): Promise<void> {
  const db = await getDB();
  const existing = await db.count('files');
  if (existing === 0) {
    for (const file of DEFAULT_FILES) {
      await db.put('files', file);
    }
  }
}

export async function getAllFiles(): Promise<FileNode[]> {
  const db = await getDB();
  return db.getAll('files');
}

export async function getFile(id: string): Promise<FileNode | undefined> {
  const db = await getDB();
  return db.get('files', id);
}

export async function getFileByPath(path: string): Promise<FileNode | undefined> {
  const db = await getDB();
  return db.getFromIndex('files', 'by-path', path);
}

export async function getChildren(parentId: string | null): Promise<FileNode[]> {
  const db = await getDB();
  const all = await db.getAll('files');
  return all.filter(f => f.parentId === parentId);
}

export async function createFile(file: Omit<FileNode, 'id' | 'createdAt' | 'updatedAt'>): Promise<FileNode> {
  const db = await getDB();
  const newFile: FileNode = {
    ...file,
    id: `file_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`,
    createdAt: Date.now(),
    updatedAt: Date.now(),
  };
  await db.put('files', newFile);
  return newFile;
}

export async function updateFile(id: string, updates: Partial<FileNode>): Promise<void> {
  const db = await getDB();
  const existing = await db.get('files', id);
  if (existing) {
    await db.put('files', { ...existing, ...updates, updatedAt: Date.now() });
  }
}

export async function updateFileContent(id: string, content: string): Promise<void> {
  await updateFile(id, { content });
}

export async function deleteFile(id: string): Promise<void> {
  const db = await getDB();
  // Also delete children if folder
  const children = await getChildren(id);
  for (const child of children) {
    await deleteFile(child.id);
  }
  await db.delete('files', id);
}

export async function renameFile(id: string, newName: string): Promise<void> {
  const existing = await getFile(id);
  if (!existing) return;
  const parentPath = existing.path.substring(0, existing.path.lastIndexOf('/'));
  const newPath = `${parentPath}/${newName}`;
  await updateFile(id, { name: newName, path: newPath });
}

export async function getSetting<T>(key: string): Promise<T | null> {
  const db = await getDB();
  const result = await db.get('settings', key);
  return result ? (result.value as T) : null;
}

export async function setSetting(key: string, value: unknown): Promise<void> {
  const db = await getDB();
  await db.put('settings', { key, value });
}
