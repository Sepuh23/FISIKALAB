import React from 'react';
import { ModuleId } from '../types/physics';

export const PixelLogoMark: React.FC<{ className?: string }> = ({ className = 'w-7 h-7' }) => (
  <svg viewBox="0 0 16 16" className={className} shapeRendering="crispEdges" aria-hidden="true">
    {/* Pixel Erlenmeyer Flask */}
    <rect x="6" y="1" width="4" height="1" fill="#1D3532" />
    <rect x="6" y="2" width="1" height="3" fill="#1D3532" />
    <rect x="9" y="2" width="1" height="3" fill="#1D3532" />
    <rect x="7" y="2" width="2" height="4" fill="#EFF5F4" />
    <rect x="5" y="5" width="1" height="2" fill="#1D3532" />
    <rect x="10" y="5" width="1" height="2" fill="#1D3532" />
    <rect x="6" y="5" width="4" height="3" fill="#EFF5F4" />
    <rect x="4" y="7" width="1" height="2" fill="#1D3532" />
    <rect x="11" y="7" width="1" height="2" fill="#1D3532" />
    <rect x="3" y="9" width="1" height="4" fill="#1D3532" />
    <rect x="12" y="9" width="1" height="4" fill="#1D3532" />
    <rect x="4" y="13" width="8" height="1" fill="#1D3532" />
    {/* Liquid inside */}
    <rect x="4" y="9" width="8" height="4" fill="#8FB5AE" />
    <rect x="5" y="8" width="6" height="1" fill="#E26D62" />
    <rect x="6" y="10" width="1" height="1" fill="#EFF5F4" />
    <rect x="9" y="11" width="1" height="1" fill="#EFF5F4" />
  </svg>
);

export const PixelModuleIllustration: React.FC<{ moduleId: ModuleId; className?: string }> = ({
  moduleId,
  className = 'w-12 h-12',
}) => {
  switch (moduleId) {
    case 'besaran':
      // Pixel Ruler & Scale Weight
      return (
        <svg viewBox="0 0 16 16" className={className} shapeRendering="crispEdges" aria-hidden="true">
          <rect x="1" y="9" width="14" height="5" fill="#CBE2DD" />
          <rect x="1" y="9" width="14" height="1" fill="#1D3532" />
          <rect x="1" y="13" width="14" height="1" fill="#1D3532" />
          <rect x="1" y="10" width="1" height="3" fill="#1D3532" />
          <rect x="14" y="10" width="1" height="3" fill="#1D3532" />
          <rect x="4" y="10" width="1" height="2" fill="#4F6A66" />
          <rect x="7" y="10" width="1" height="2" fill="#E26D62" />
          <rect x="10" y="10" width="1" height="2" fill="#4F6A66" />
          <rect x="6" y="3" width="4" height="1" fill="#8C685C" />
          <rect x="5" y="4" width="6" height="4" fill="#8C685C" />
          <rect x="7" y="5" width="2" height="1" fill="#EFF5F4" />
        </svg>
      );
    case 'kinematika':
      // Pixel Trajectory Cannon & Ball
      return (
        <svg viewBox="0 0 16 16" className={className} shapeRendering="crispEdges" aria-hidden="true">
          <rect x="1" y="12" width="14" height="2" fill="#95B3A6" />
          <rect x="2" y="10" width="3" height="2" fill="#1D3532" />
          <rect x="4" y="9" width="2" height="2" fill="#4F6A66" />
          <rect x="6" y="7" width="1" height="1" fill="#8FB5AE" />
          <rect x="8" y="5" width="1" height="1" fill="#8FB5AE" />
          <rect x="10" y="4" width="2" height="2" fill="#E26D62" />
          <rect x="13" y="6" width="1" height="1" fill="#8FB5AE" />
          <rect x="14" y="9" width="1" height="1" fill="#8FB5AE" />
        </svg>
      );
    case 'dinamika':
      // Pixel Force Block & Arrow
      return (
        <svg viewBox="0 0 16 16" className={className} shapeRendering="crispEdges" aria-hidden="true">
          <rect x="1" y="12" width="14" height="2" fill="#95B3A6" />
          <rect x="6" y="6" width="6" height="6" fill="#8C685C" />
          <rect x="7" y="7" width="4" height="4" fill="#CBE2DD" />
          <rect x="1" y="8" width="4" height="2" fill="#E26D62" />
          <rect x="4" y="7" width="1" height="4" fill="#E26D62" />
          <rect x="8" y="2" width="2" height="3" fill="#1D3532" />
          <rect x="7" y="4" width="4" height="1" fill="#1D3532" />
        </svg>
      );
    case 'energi':
      // Pixel Pendulum & Spring
      return (
        <svg viewBox="0 0 16 16" className={className} shapeRendering="crispEdges" aria-hidden="true">
          <rect x="3" y="1" width="10" height="2" fill="#1D3532" />
          <rect x="7" y="3" width="1" height="3" fill="#4F6A66" />
          <rect x="8" y="6" width="1" height="2" fill="#4F6A66" />
          <rect x="9" y="8" width="1" height="2" fill="#4F6A66" />
          <rect x="9" y="10" width="3" height="3" fill="#E26D62" />
          <rect x="3" y="10" width="2" height="2" fill="#8FB5AE" />
          <rect x="6" y="12" width="2" height="2" fill="#CBE2DD" />
        </svg>
      );
    case 'termodinamika':
      // Pixel Thermometer & Gas Molecules
      return (
        <svg viewBox="0 0 16 16" className={className} shapeRendering="crispEdges" aria-hidden="true">
          <rect x="4" y="2" width="3" height="9" fill="#CBE2DD" />
          <rect x="4" y="2" width="3" height="1" fill="#1D3532" />
          <rect x="3" y="3" width="1" height="7" fill="#1D3532" />
          <rect x="7" y="3" width="1" height="7" fill="#1D3532" />
          <rect x="3" y="10" width="5" height="4" fill="#E26D62" />
          <rect x="5" y="5" width="1" height="6" fill="#E26D62" />
          <rect x="10" y="4" width="2" height="2" fill="#8FB5AE" />
          <rect x="12" y="8" width="2" height="2" fill="#8C685C" />
          <rect x="10" y="11" width="2" height="2" fill="#4F6A66" />
        </svg>
      );
  }
};

export const PixelLabBanner: React.FC<{ className?: string }> = ({ className = 'w-20 h-20' }) => (
  <svg viewBox="0 0 24 24" className={className} shapeRendering="crispEdges" aria-hidden="true">
    {/* Desk */}
    <rect x="2" y="19" width="20" height="2" fill="#8C685C" />
    {/* Microscope / Lab Apparatus */}
    <rect x="5" y="16" width="6" height="3" fill="#1D3532" />
    <rect x="7" y="8" width="2" height="8" fill="#4F6A66" />
    <rect x="9" y="7" width="4" height="2" fill="#1D3532" />
    <rect x="11" y="9" width="2" height="4" fill="#8FB5AE" />
    <rect x="10" y="14" width="4" height="1" fill="#E26D62" />
    {/* Beaker */}
    <rect x="16" y="12" width="4" height="7" fill="#CBE2DD" />
    <rect x="16" y="15" width="4" height="4" fill="#8FB5AE" />
    <rect x="15" y="12" width="1" height="7" fill="#1D3532" />
    <rect x="20" y="12" width="1" height="7" fill="#1D3532" />
    <rect x="16" y="18" width="4" height="1" fill="#1D3532" />
    {/* Floating Atom Pixel */}
    <rect x="17" y="5" width="2" height="2" fill="#E26D62" />
    <rect x="15" y="4" width="1" height="1" fill="#95B3A6" />
    <rect x="20" y="7" width="1" height="1" fill="#95B3A6" />
  </svg>
);
