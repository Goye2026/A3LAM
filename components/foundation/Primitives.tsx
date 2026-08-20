import Link from "next/link";
import type {
  AnchorHTMLAttributes,
  ButtonHTMLAttributes,
  HTMLAttributes,
  InputHTMLAttributes,
  LabelHTMLAttributes,
} from "react";

export function Box({ className = "", ...props }: HTMLAttributes<HTMLDivElement>) {
  return <div className={className} {...props} />;
}

export function Stack({ className = "", ...props }: HTMLAttributes<HTMLDivElement>) {
  return <div className={`foundation-stack ${className}`} {...props} />;
}

export function Inline({ className = "", ...props }: HTMLAttributes<HTMLDivElement>) {
  return <div className={`foundation-inline ${className}`} {...props} />;
}

export function Container({ className = "", ...props }: HTMLAttributes<HTMLDivElement>) {
  return <div className={`foundation-container ${className}`} {...props} />;
}

export function Text({ className = "", ...props }: HTMLAttributes<HTMLParagraphElement>) {
  return <p className={`foundation-text ${className}`} {...props} />;
}

export function Heading({
  level = 2,
  className = "",
  ...props
}: HTMLAttributes<HTMLHeadingElement> & { level?: 1 | 2 | 3 | 4 }) {
  const Tag = `h${level}` as const;
  return <Tag className={`foundation-heading foundation-heading-${level} ${className}`} {...props} />;
}

export function Button({ className = "", ...props }: ButtonHTMLAttributes<HTMLButtonElement>) {
  return <button className={`foundation-button ${className}`} {...props} />;
}

export function FoundationLink({
  className = "",
  ...props
}: AnchorHTMLAttributes<HTMLAnchorElement> & { href: string }) {
  return <Link className={`foundation-link ${className}`} {...props} />;
}

export function Label({ className = "", ...props }: LabelHTMLAttributes<HTMLLabelElement>) {
  return <label className={`foundation-label ${className}`} {...props} />;
}

export function Input({ className = "", ...props }: InputHTMLAttributes<HTMLInputElement>) {
  return <input className={`foundation-input ${className}`} {...props} />;
}

export function Surface({ className = "", ...props }: HTMLAttributes<HTMLDivElement>) {
  return <div className={`foundation-surface ${className}`} {...props} />;
}

export function Divider({ className = "", ...props }: HTMLAttributes<HTMLHRElement>) {
  return <hr className={`foundation-divider ${className}`} {...props} />;
}
