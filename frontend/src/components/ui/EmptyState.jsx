import React from 'react';

export default function EmptyState({ icon: Icon, title, description }) {
  return (
    <div className="h-full w-full flex flex-col items-center justify-center p-6 text-center">
      {Icon && (
        <div className="w-20 h-20 rounded-full bg-bg-secondary flex items-center justify-center mb-5 border border-border text-text-muted">
          <Icon className="w-8 h-8 opacity-70" strokeWidth={1.5} />
        </div>
      )}
      <h3 className="text-text-primary font-medium text-lg mb-1.5">{title}</h3>
      {description && (
        <p className="text-text-muted text-sm max-w-[280px] mx-auto leading-relaxed">
          {description}
        </p>
      )}
    </div>
  );
}
