"use client";

import React from "react";
import Markdown from "react-markdown";
import remarkGfm from "remark-gfm";
import rehypeRaw from "rehype-raw";
import rehypeSlug from "rehype-slug";
import rehypeSanitize from "rehype-sanitize";
import rehypeExternalLinks from "rehype-external-links";

interface RenderMarkdownProps {
  content: string;
  className?: string;
}

export function RenderMarkdown({
  content,
  className = "",
}: RenderMarkdownProps) {
  if (!content) return null;

  return (
    <div
      className={`prose prose-blue max-w-none prose-headings:font-bold prose-p:my-4 prose-li:my-1 prose-headings:mt-6 prose-headings:mb-4 prose-table:my-4 ${className}`}
    >
      <Markdown
        remarkPlugins={[remarkGfm]}
        rehypePlugins={[
          rehypeRaw,
          rehypeSlug,
          rehypeSanitize,
          [
            rehypeExternalLinks,
            {
              target: "_blank",
              rel: ["nofollow", "noopener", "noreferrer"],
            },
          ],
        ]}
        components={{
          // Titres avec différentes tailles et styles
          h1: ({ ...props }) => (
            <h1
              className="text-xl font-semibold my-6 pb-2 border-b text-gray-900"
              {...props}
            />
          ),
          h2: ({ ...props }) => (
            <h2
              className="text-md font-semibold my-5 text-gray-800"
              {...props}
            />
          ),
          h3: ({ ...props }) => (
            <h3
              className="text-md font-semibold my-4 text-gray-800"
              {...props}
            />
          ),
          h4: ({ ...props }) => (
            <h4
              className="text-base font-semibold my-3 text-gray-700"
              {...props}
            />
          ),
          h5: ({ ...props }) => (
            <h5
              className="text-sm font-semibold my-2 text-gray-700"
              {...props}
            />
          ),
          h6: ({ ...props }) => (
            <h6 className="text-sm font-medium my-2 text-gray-600" {...props} />
          ),

          // Paragraphes et texte
          p: ({ ...props }) => (
            <p className="my-4 text-gray-700 leading-relaxed" {...props} />
          ),
          strong: ({ ...props }) => (
            <strong className="font-bold text-gray-900" {...props} />
          ),
          em: ({ ...props }) => (
            <em className="italic text-gray-800" {...props} />
          ),

          // Listes
          ul: ({ ...props }) => (
            <ul className="my-4 pl-6 list-disc space-y-2" {...props} />
          ),
          ol: ({ ...props }) => (
            <ol className="my-4 pl-6 list-decimal space-y-2" {...props} />
          ),
          li: ({ ...props }) => <li className="my-1 pl-1" {...props} />,

          // Tableaux
          table: ({ ...props }) => (
            <div className="overflow-x-auto my-6 rounded-md border border-gray-200">
              <table className="border-collapse w-full" {...props} />
            </div>
          ),
          th: ({ ...props }) => (
            <th
              className="border border-gray-300 bg-gray-100 p-3 font-semibold text-left text-gray-700"
              {...props}
            />
          ),
          td: ({ ...props }) => (
            <td
              className="border border-gray-300 p-3 text-gray-700"
              {...props}
            />
          ),

          // Autres éléments
          blockquote: ({ ...props }) => (
            <blockquote
              className="border-l-4 border-blue-500 pl-4 py-1 my-4 bg-blue-50 rounded-r-md italic text-gray-700"
              {...props}
            />
          ),
          code: ({ ...props }) => (
            <code
              className="bg-gray-100 text-red-500 px-1 py-0.5 rounded text-sm font-mono"
              {...props}
            />
          ),
          pre: ({ ...props }) => (
            <pre
              className="bg-gray-800 text-gray-100 p-4 rounded-md overflow-x-auto my-4 text-sm font-mono"
              {...props}
            />
          ),
          a: ({ ...props }) => (
            <a
              className="text-blue-600 hover:text-blue-800 hover:underline"
              {...props}
            />
          ),
          hr: ({ ...props }) => (
            <hr className="my-6 border-t border-gray-300" {...props} />
          ),
        }}
      >
        {content}
      </Markdown>
    </div>
  );
}
