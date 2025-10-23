import * as React from "react";

export const TextEditor = (p: React.InputHTMLAttributes<HTMLInputElement>) =>
  <input className="h-10 w-full rounded-full bg-surface border border-hairline px-3" {...p} />;

export const DateEditor = (p: React.InputHTMLAttributes<HTMLInputElement>) =>
  <input type="text" placeholder="mm/dd/yyyy" className="h-10 w-full rounded-full bg-surface border border-hairline px-3" {...p} />;

export const SelectEditor = (p: React.SelectHTMLAttributes<HTMLSelectElement>) =>
  <select className="h-10 w-full rounded-full bg-surface border border-hairline px-3" {...p} />;

