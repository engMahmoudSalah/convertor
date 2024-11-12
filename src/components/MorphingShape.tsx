import React from 'react';

export const MorphingShape: React.FC = () => {
  return (
    <div className="absolute top-0 right-0 w-[600px] h-[600px] -z-10">
      <div className="absolute w-full h-full bg-gradient-to-r from-violet-600/10 to-blue-600/10 rounded-full 
        animate-[morph_8s_ease-in-out_infinite] mix-blend-multiply" />
      <div className="absolute w-full h-full bg-gradient-to-r from-blue-600/10 to-cyan-600/10 rounded-full 
        animate-[morph_8s_ease-in-out_infinite_2s] mix-blend-multiply" />
      <div className="absolute w-full h-full bg-gradient-to-r from-cyan-600/10 to-violet-600/10 rounded-full 
        animate-[morph_8s_ease-in-out_infinite_4s] mix-blend-multiply" />
    </div>
  );
};