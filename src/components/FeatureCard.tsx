import React from 'react';
import { LucideIcon } from 'lucide-react';

interface FeatureCardProps {
  title: string;
  description: string;
  icon: LucideIcon;
}

export const FeatureCard: React.FC<FeatureCardProps> = ({ title, description, icon: Icon }) => {
  return (
    <div className="group relative bg-black/20 backdrop-blur-lg p-6 rounded-2xl border border-white/10
      hover:border-white/20 transition-all duration-300 hover:shadow-lg hover:shadow-violet-500/10">
      <div className="absolute inset-0 bg-gradient-to-r from-violet-600/10 to-blue-600/10 rounded-2xl opacity-0 
        group-hover:opacity-100 transition-opacity duration-300" />
      
      <div className="relative">
        <div className="w-12 h-12 rounded-full bg-gradient-to-r from-violet-600 to-blue-600 p-2
          flex items-center justify-center mb-4">
          <Icon className="w-6 h-6 text-white" />
        </div>
        
        <h3 className="text-xl font-semibold text-white mb-2">{title}</h3>
        <p className="text-gray-400">{description}</p>
      </div>
    </div>
  );
};