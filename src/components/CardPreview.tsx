import React from 'react';
import { 
  Mail, 
  Phone, 
  Globe, 
  Instagram, 
  Linkedin, 
  Github, 
  Twitter,
  Facebook,
  Youtube,
  Camera,
  MessageCircle
} from 'lucide-react';
import type { Database } from '../lib/supabase';

type SocialLink = Database['public']['Tables']['social_links']['Row'];

interface FormData {
  // Basic Information
  title: string;
  username: string;
  company: string;
  tagline: string;
  profession: string;
  avatar_url: string;
  
  // Contact Information
  phone: string;
  whatsapp: string;
  email: string;
  website: string;
  address: string;
  map_link: string;
  
  // Theme and Layout
  theme: {
    primary: string;
    secondary: string;
    background: string;
    text: string;
    name: string;
  };
  shape: string;
  layout: {
    style: string;
    alignment: string;
    font: string;
  };
  is_published: boolean;
}

interface CardPreviewProps {
  formData: FormData;
  socialLinks: SocialLink[];
}

const SOCIAL_ICONS: Record<string, React.ComponentType<any>> = {
  Instagram,
  LinkedIn: Linkedin,
  GitHub: Github,
  Twitter,
  Facebook,
  'You Tube': Youtube,
  Website: Globe,
};

export const CardPreview: React.FC<CardPreviewProps> = ({ formData, socialLinks }) => {
  const getCardShapeClasses = () => {
    switch (formData.shape) {
      case 'rounded':
        return 'rounded-2xl';
      case 'circle':
        return 'rounded-full aspect-square';
      case 'hexagon':
        return 'rounded-3xl';
      default:
        return 'rounded-lg';
    }
  };

  const getLayoutClasses = () => {
    const baseClasses = 'flex flex-col';
    switch (formData.layout.alignment) {
      case 'left':
        return `${baseClasses} items-start text-left`;
      case 'right':
        return `${baseClasses} items-end text-right`;
      default:
        return `${baseClasses} items-center text-center`;
    }
  };

  const getStyleClasses = () => {
    switch (formData.layout.style) {
      case 'classic':
        return 'border-2 border-gray-200';
      case 'minimal':
        return 'border border-gray-100 shadow-sm';
      case 'creative':
        return 'shadow-2xl transform rotate-1 hover:rotate-0 transition-transform duration-300';
      default:
        return 'shadow-lg border border-gray-100';
    }
  };

  const fontFamily = formData.layout.font.replace(' ', '+');

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-lg font-semibold text-gray-900">Live Preview</h2>
        <div className={`px-2 py-1 rounded-full text-xs font-medium ${
          formData.is_published 
            ? 'bg-green-100 text-green-800' 
            : 'bg-gray-100 text-gray-600'
        }`}>
          {formData.is_published ? 'Published' : 'Draft'}
        </div>
      </div>

      {/* Card Preview Container */}
      <div className="flex justify-center">
        <div className="w-80 h-48 relative">
          <div
            className={`w-full h-full p-6 ${getCardShapeClasses()} ${getStyleClasses()} ${getLayoutClasses()}`}
            style={{
              backgroundColor: formData.theme.background,
              color: formData.theme.text,
              fontFamily: `'${formData.layout.font}', sans-serif`,
            }}
          >
            {/* Avatar Placeholder */}
            {formData.avatar_url ? (
              <img
                src={formData.avatar_url}
                alt="Profile"
                className="w-16 h-16 rounded-full object-cover mb-3 border-2"
                style={{ borderColor: formData.theme.primary }}
              />
            ) : (
              <div 
                className="w-16 h-16 rounded-full mb-3 flex items-center justify-center text-white font-bold text-xl border-2"
                style={{ 
                  backgroundColor: formData.theme.primary,
                  borderColor: formData.theme.secondary
                }}
              >
                {formData.title ? formData.title.charAt(0).toUpperCase() : <Camera className="w-6 h-6" />}
              </div>
            )}

            {/* Name and Title */}
            <div className="mb-2">
              <h3 
                className="font-bold text-lg leading-tight"
                style={{ color: formData.theme.text }}
              >
                {formData.title || 'Your Name'}
              </h3>
              {formData.profession && (
                <p 
                  className="text-sm opacity-80"
                  style={{ color: formData.theme.secondary }}
                >
                  {formData.profession}
                </p>
              )}
              {formData.company && (
                <p 
                  className="text-xs opacity-70"
                  style={{ color: formData.theme.text }}
                >
                  {formData.company}
                </p>
              )}
              {formData.tagline && (
                <p 
                  className="text-xs opacity-60 mt-1"
                  style={{ color: formData.theme.text }}
                >
                  {formData.tagline}
                </p>
              )}
            </div>

            {/* Contact Info */}
            <div className="space-y-1 mb-3">
              {formData.email && (
                <div className="flex items-center gap-2 text-xs">
                  <Mail className="w-3 h-3" style={{ color: formData.theme.primary }} />
                  <span className="truncate">{formData.email}</span>
                </div>
              )}
              {formData.phone && (
                <div className="flex items-center gap-2 text-xs">
                  <Phone className="w-3 h-3" style={{ color: formData.theme.primary }} />
                  <span>{formData.phone}</span>
                </div>
              )}
              {formData.whatsapp && (
                <div className="flex items-center gap-2 text-xs">
                  <MessageCircle className="w-3 h-3" style={{ color: formData.theme.primary }} />
                  <span>WhatsApp</span>
                </div>
              )}
              {formData.website && (
                <div className="flex items-center gap-2 text-xs">
                  <Globe className="w-3 h-3" style={{ color: formData.theme.primary }} />
                  <span className="truncate">{formData.website}</span>
                </div>
              )}
            </div>

            {/* Social Links */}
            {socialLinks.length > 0 && (
              <div className="flex gap-2 justify-center">
                {socialLinks.slice(0, 4).map((link) => {
                  const Icon = SOCIAL_ICONS[link.platform] || Globe;
                  return (
                    <div
                      key={link.id}
                      className="w-6 h-6 rounded-full flex items-center justify-center"
                      style={{ backgroundColor: formData.theme.primary }}
                    >
                      <Icon className="w-3 h-3 text-white" />
                    </div>
                  );
                })}
                {socialLinks.length > 4 && (
                  <div
                    className="w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold text-white"
                    style={{ backgroundColor: formData.theme.secondary }}
                  >
                    +{socialLinks.length - 4}
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Preview Info */}
      <div className="mt-4 p-3 bg-gray-50 rounded-lg">
        <div className="text-xs text-gray-600 space-y-1">
          <div className="flex justify-between">
            <span>Username:</span>
            <span className="font-medium">/{formData.username || 'username'}</span>
          </div>
          <div className="flex justify-between">
            <span>Theme:</span>
            <span className="font-medium">{formData.theme.name}</span>
          </div>
          <div className="flex justify-between">
            <span>Profession:</span>
            <span className="font-medium">{formData.profession || 'Not set'}</span>
          </div>
          <div className="flex justify-between">
            <span>Status:</span>
            <span className={`font-medium ${formData.is_published ? 'text-green-600' : 'text-gray-600'}`}>
              {formData.is_published ? 'Published' : 'Draft'}
            </span>
          </div>
          <div className="flex justify-between">
            <span>Social Links:</span>
            <span className="font-medium">{socialLinks.length}</span>
          </div>
        </div>
      </div>
    </div>
  );
};