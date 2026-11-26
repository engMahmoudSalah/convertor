import React, { useState } from 'react';
import { ChevronRight } from 'lucide-react';

export const countStats = (s: string) => {
  const t = s.trim();
  return { chars: [...s].length, words: t ? t.split(/\s+/).length : 0, lines: s ? s.split('\n').length : 0, bytes: new Blob([s]).size };
};

/** Small strip of live counters under a text area. */
export const StatStrip: React.FC<{ text: string; labels: { chars: string; words: string; lines: string; bytes: string } }> = ({ text, labels }) => {
  const s = countStats(text);
  return (<div dir="ltr" className="flex flex-wrap gap-x-4 gap-y-1 text-xs opacity-70 mt-2" aria-label="counts">
    <span>{s.chars} {labels.chars}</span><span>{s.words} {labels.words}</span><span>{s.lines} {labels.lines}</span><span>{s.bytes} {labels.bytes}</span></div>);
};

const KEY = 'tj-key';
const kind = (v: any) => (v === null ? 'null' : Array.isArray(v) ? 'array' : typeof v);
const Leaf: React.FC<{ v: any }> = ({ v }) => {
  const k = kind(v);
  const cls = k === 'string' ? 'tj-str' : k === 'number' ? 'tj-num' : 'tj-lit';
  return <span className={cls}>{k === 'string' ? JSON.stringify(v) : String(v)}</span>;
};
const Node: React.FC<{ name?: string; v: any; depth: number; more: string }> = ({ name, v, depth, more }) => {
  const k = kind(v); const [open, setOpen] = useState(depth < 2); const [lim, setLim] = useState(100);
  const label = name !== undefined ? <><span className={KEY}>{name}</span><span className="opacity-50">: </span></> : null;
  if (k !== 'object' && k !== 'array') return <div className="ps-5 py-0.5">{label}<Leaf v={v} /></div>;
  const entries: [string, any][] = k === 'array' ? (v as any[]).map((x, i) => [String(i), x]) : Object.entries(v);
  return (<div className={depth ? 'ps-4 border-s border-current/10' : ''}>
    <button type="button" onClick={() => setOpen(!open)} aria-expanded={open} className="flex items-center gap-1 py-0.5 text-start bg-transparent border-0 p-0 font-mono text-sm">
      <ChevronRight size={14} className={`transition-transform rtl:rotate-180 ${open ? 'rotate-90 rtl:rotate-90' : ''}`} aria-hidden="true" />{label}
      <span className="opacity-60">{k === 'array' ? `[${entries.length}]` : `{${entries.length}}`}</span></button>
    {open && <div>{entries.slice(0, lim).map(([n, x]) => <Node key={n} name={n} v={x} depth={depth + 1} more={more} />)}
      {entries.length > lim && <button type="button" className="ps-5 text-xs underline opacity-70" onClick={() => setLim(lim + 200)}>{more} ({entries.length - lim})</button>}</div>}
  </div>);
};
export const tryParseJson = (s: string): any | undefined => {
  const t = s.trim(); if (!t || t.length > 400000 || !/^[\[{]/.test(t)) return undefined;
  try { return JSON.parse(t); } catch { return undefined; }
};
export const JsonTree: React.FC<{ data: any; more: string }> = ({ data, more }) => (
  <div dir="ltr" className="font-mono text-sm min-h-[240px] max-h-[70vh] overflow-auto" role="tree"><Node v={data} depth={0} more={more} /></div>);

export const EXAMPLES: { test: RegExp; text: string }[] = [
  { test: /^(json-(?!escape)|jwt|yaml-to-json$)/, text: '{"name":"Magic Convertor","version":2,"tags":["pdf","images","text"],"owner":{"name":"Mahmoud","active":true},"price":null}' },
  { test: /^csv-/, text: 'name,city,score\nAhmed,Cairo,92\nSara,Alexandria,88\nOmar,Giza,75' },
  { test: /^(word|char|text|case|line|sort|remove|reverse|slug|count|find|trim|extra|dup)/, text: 'Hello world.  Hello Cairo!\nthe quick brown fox jumps over the lazy dog\nthe quick brown fox jumps over the lazy dog' },
];
export const exampleFor = (id: string) => EXAMPLES.find((e) => e.test.test(id))?.text;
