import React, { useMemo } from 'react';
import katex from 'katex';

interface MathDisplayProps {
  latex: string;
  block?: boolean;
  className?: string;
}

export const MathDisplay: React.FC<MathDisplayProps> = ({
  latex,
  block = false,
  className = '',
}) => {
  const html = useMemo(() => {
    try {
      return katex.renderToString(latex, {
        displayMode: block,
        throwOnError: false,
        strict: false,
      });
    } catch {
      return '';
    }
  }, [latex, block]);

  if (!html) {
    return <span className={`font-mono-tabular text-sm ${className}`}>{latex}</span>;
  }

  return (
    <span
      className={className}
      dangerouslySetInnerHTML={{ __html: html }}
    />
  );
};
