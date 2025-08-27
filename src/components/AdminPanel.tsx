import React, { useState, useEffect } from 'react';
import { 
  Plus, 
  Edit3, 
  Trash2, 
  Eye, 
  Share2, 
  Download,
  Settings,
  LogOut,
  CreditCard,
  Users,
  BarChart3,
  Palette,
  Layout,
  Globe,
  Mail,
  Phone,
  Instagram,
  Linkedin,
  Github,
  Twitter,
  Facebook,
  Youtube,
  MapPin,
  Camera,
  Video,
  FileText,
  Star,
  Save,
  User,
  Building,
  MessageCircle,
  ExternalLink,
  Upload,
  X
} from 'lucide-react';
import { useAuth } from '../hooks/useAuth';
import { supabase } from '../lib/supabase';
import { CardPreview } from './CardPreview';
import type { Database } from '../lib/supabase';
import { useNavigate } from 'react-router-dom';

type BusinessCard = Database['public']['Tables']['business_cards']['Row'];
type SocialLink = Database['public']['Tables']['social_links']['Row'];
type Profile = Database['public']['Tables']['profiles']['Row'];

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

interface MediaItem {
  id: string;
  type: 'image' | 'video' | 'document';
  url: string;
  title: string;
  description?: string;
}

interface Review {
  id: string;
  name: string;
  rating: number;
  comment: string;
  date: string;
}

const SOCIAL_PLATFORMS = [
  { name: 'Facebook', icon: Facebook, placeholder: 'facebook.com/username' },
  { name: 'Instagram', icon: Instagram, placeholder: 'instagram.com/username' },
  { name: 'Twitter', icon: Twitter, placeholder: 'twitter.com/username' },
  { name: 'LinkedIn', icon: Linkedin, placeholder: 'linkedin.com/in/username' },
  { name: 'YouTube', icon: Youtube, placeholder: 'youtube.com/@username' },
  { name: 'WhatsApp', icon: MessageCircle, placeholder: 'wa.me/1234567890' },
  { name: 'Telegram', icon: MessageCircle, placeholder: 't.me/username' },
  { name: 'Custom Link', icon: ExternalLink, placeholder: 'https://yourlink.com' }
];

const THEME_PRESETS = [
  { name: 'Ocean Blue', primary: '#3B82F6', secondary: '#1E40AF', background: '#FFFFFF', text: '#1F2937' },
  { name: 'Forest Green', primary: '#10B981', secondary: '#047857', background: '#FFFFFF', text: '#1F2937' },
  { name: 'Sunset Orange', primary: '#F59E0B', secondary: '#D97706', background: '#FFFFFF', text: '#1F2937' },
  { name: 'Royal Purple', primary: '#8B5CF6', secondary: '#7C3AED', background: '#FFFFFF', text: '#1F2937' },
  { name: 'Rose Pink', primary: '#EC4899', secondary: '#DB2777', background: '#FFFFFF', text: '#1F2937' },
  { name: 'Dark Mode', primary: '#60A5FA', secondary: '#3B82F6', background: '#1F2937', text: '#F9FAFB' },
];

const PROFESSIONS = [
  'Doctor', 'Developer', 'Designer', 'Consultant', 'Teacher', 'Engineer',
  'Restaurant', 'Shop', 'Salon', 'Gym', 'Photographer', 'Artist',
  'Lawyer', 'Accountant', 'Real Estate', 'Marketing', 'Other'
];

export const AdminPanel: React.FC = () => {
  const { user, signOut, loading } = useAuth();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<'dashboard' | 'basic' | 'contact' | 'social' | 'media' | 'reviews' | 'settings'>('dashboard');
  const [businessCard, setBusinessCard] = useState<BusinessCard | null>(null);
  const [socialLinks, setSocialLinks] = useState<SocialLink[]>([]);
  const [mediaItems, setMediaItems] = useState<MediaItem[]>([]);
  const [reviews, setReviews] = useState<Review[]>([]);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [saving, setSaving] = useState(false);
  const [hasCard, setHasCard] = useState(false);

  const [formData, setFormData] = useState<FormData>({
    title: '',
    username: '',
    company: '',
    tagline: '',
    profession: '',
    avatar_url: '',
    phone: '',
    whatsapp: '',
    email: user?.email || '',
    website: '',
    address: '',
    map_link: '',
    theme: THEME_PRESETS[0],
    shape: 'rounded',
    layout: {
      style: 'modern',
      alignment: 'center',
      font: 'Inter'
    },
    is_published: false
  });

  const [newSocialLink, setNewSocialLink] = useState({
    platform: 'Facebook',
    username: '',
    url: ''
  });

  useEffect(() => {
    loadData();
  }, [user]);

  useEffect(() => {
    if (!loading && !user) {
      navigate('/', { replace: true });
    }
  }, [user, loading, navigate]);

  const loadData = async () => {
    if (!user) return;

    try {
      // Load profile
      const { data: profileData } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .single();

      if (profileData) {
        setProfile(profileData);
      }

      // Load business card
      const { data: cardData } = await supabase
        .from('business_cards')
        .select('*')
        .eq('user_id', user.id)
        .single();

      if (cardData) {
        setBusinessCard(cardData);
        setHasCard(true);
        
        // Populate form with existing data
        setFormData({
          title: cardData.title || '',
          username: cardData.slug || '',
          company: cardData.company || '',
          tagline: cardData.bio || '',
          profession: cardData.position || '',
          avatar_url: cardData.avatar_url || '',
          phone: cardData.phone || '',
          whatsapp: '', // Add to database schema if needed
          email: cardData.email || user.email || '',
          website: cardData.website || '',
          address: '', // Add to database schema if needed
          map_link: '', // Add to database schema if needed
          theme: (cardData.theme as any) || THEME_PRESETS[0],
          shape: cardData.shape || 'rounded',
          layout: (cardData.layout as any) || { style: 'modern', alignment: 'center', font: 'Inter' },
          is_published: cardData.is_published
        });

        // Load social links
        const { data: socialData } = await supabase
          .from('social_links')
          .select('*')
          .eq('card_id', cardData.id);

        if (socialData) {
          setSocialLinks(socialData);
        }
      } else {
        setHasCard(false);
        // Set default values for new card
        setFormData(prev => ({
          ...prev,
          title: profileData?.name || '',
          email: user.email || ''
        }));
      }
    } catch (error) {
      console.error('Error loading data:', error);
    }
  };

  const handleSaveCard = async () => {
    if (!user) return;

    try {
      setSaving(true);

      const cardData = {
        user_id: user.id,
        title: formData.title,
        company: formData.company,
        position: formData.profession,
        phone: formData.phone,
        email: formData.email,
        website: formData.website,
        avatar_url: formData.avatar_url,
        bio: formData.tagline,
        theme: formData.theme,
        shape: formData.shape,
        layout: formData.layout,
        is_published: formData.is_published,
        slug: formData.username
      };

      let cardId: string;

      if (businessCard) {
        // Update existing card
        const { data, error } = await supabase
          .from('business_cards')
          .update(cardData)
          .eq('id', businessCard.id)
          .select()
          .single();

        if (error) throw error;
        cardId = businessCard.id;
        setBusinessCard(data);
      } else {
        // Create new card
        const { data, error } = await supabase
          .from('business_cards')
          .insert(cardData)
          .select()
          .single();

        if (error) throw error;
        cardId = data.id;
        setBusinessCard(data);
        setHasCard(true);
      }

      // Update social links
      await supabase
        .from('social_links')
        .delete()
        .eq('card_id', cardId);

      if (socialLinks.length > 0) {
        const socialLinksData = socialLinks.map(link => ({
          card_id: cardId,
          platform: link.platform,
          username: link.username,
          url: link.url
        }));

        await supabase
          .from('social_links')
          .insert(socialLinksData);
      }

      alert('Card saved successfully!');
    } catch (error) {
      console.error('Error saving card:', error);
      alert('Failed to save card. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  const addSocialLink = () => {
    if (!newSocialLink.url) return;

    const link: SocialLink = {
      id: Date.now().toString(),
      card_id: '',
      platform: newSocialLink.platform,
      username: newSocialLink.username,
      url: newSocialLink.url,
      created_at: new Date().toISOString(),
      display_order: 0,
      is_active: true
    };

    setSocialLinks([...socialLinks, link]);
    setNewSocialLink({ platform: 'Facebook', username: '', url: '' });
  };

  const removeSocialLink = (index: number) => {
    setSocialLinks(socialLinks.filter((_, i) => i !== index));
  };

  const handleSignOut = async () => {
    await signOut();
    navigate('/');
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600">Loading your dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b border-gray-200 sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 bg-gradient-to-r from-blue-600 to-purple-600 rounded-lg flex items-center justify-center">
                <CreditCard className="w-5 h-5 text-white" />
              </div>
              <h1 className="text-xl font-bold text-gray-900">Digital Business Card</h1>
            </div>
            
            <div className="flex items-center gap-4">
              <span className="text-sm text-gray-600">Welcome, {profile?.name || user?.email}</span>
              {hasCard && formData.is_published && (
                <a
                  href={`/c/${businessCard?.id}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 px-3 py-2 text-sm bg-green-50 text-green-600 rounded-lg hover:bg-green-100 transition-colors"
                >
                  <Eye className="w-4 h-4" />
                  View Live Card
                </a>
              )}
              <button
                onClick={handleSignOut}
                className="inline-flex items-center gap-2 px-3 py-2 text-sm text-gray-600 hover:text-gray-900 transition-colors"
              >
                <LogOut className="w-4 h-4" />
                Sign Out
              </button>
            </div>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Navigation Tabs */}
        <div className="flex flex-wrap gap-2 bg-gray-100 p-1 rounded-lg mb-8">
          {[
            { id: 'dashboard', label: 'Dashboard', icon: BarChart3 },
            { id: 'basic', label: 'Basic Info', icon: User },
            { id: 'contact', label: 'Contact', icon: Phone },
            { id: 'social', label: 'Social Media', icon: Globe },
            { id: 'media', label: 'Media & Gallery', icon: Camera },
            { id: 'reviews', label: 'Reviews', icon: Star },
            { id: 'settings', label: 'Settings', icon: Settings }
          ].map((tab) => {
            const Icon = tab.icon;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                className={`px-4 py-2 rounded-md text-sm font-medium transition-all ${
                  activeTab === tab.id
                    ? 'bg-white text-blue-600 shadow-sm'
                    : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                <div className="flex items-center gap-2">
                  <Icon className="w-4 h-4" />
                  <span className="hidden sm:inline">{tab.label}</span>
                </div>
              </button>
            );
          })}
        </div>

        {/* Content */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main Content */}
          <div className="lg:col-span-2">
            {activeTab === 'dashboard' && (
              <div className="space-y-6">
                <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                  <h2 className="text-2xl font-bold text-gray-900 mb-4">Dashboard Overview</h2>
                  
                  {!hasCard ? (
                    <div className="text-center py-12">
                      <CreditCard className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                      <h3 className="text-lg font-medium text-gray-900 mb-2">Create Your Digital Business Card</h3>
                      <p className="text-gray-600 mb-6">Get started by filling out your basic information.</p>
                      <button
                        onClick={() => setActiveTab('basic')}
                        className="inline-flex items-center gap-2 px-6 py-3 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 transition-colors"
                      >
                        <Plus className="w-5 h-5" />
                        Get Started
                      </button>
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                      <div className="bg-blue-50 rounded-lg p-4">
                        <div className="flex items-center gap-3">
                          <Eye className="w-8 h-8 text-blue-600" />
                          <div>
                            <div className="text-2xl font-bold text-blue-900">{businessCard?.view_count || 0}</div>
                            <div className="text-sm text-blue-600">Total Views</div>
                          </div>
                        </div>
                      </div>
                      
                      <div className="bg-green-50 rounded-lg p-4">
                        <div className="flex items-center gap-3">
                          <Share2 className="w-8 h-8 text-green-600" />
                          <div>
                            <div className="text-2xl font-bold text-green-900">{socialLinks.length}</div>
                            <div className="text-sm text-green-600">Social Links</div>
                          </div>
                        </div>
                      </div>
                      
                      <div className="bg-purple-50 rounded-lg p-4">
                        <div className="flex items-center gap-3">
                          <Globe className="w-8 h-8 text-purple-600" />
                          <div>
                            <div className="text-2xl font-bold text-purple-900">
                              {formData.is_published ? 'Live' : 'Draft'}
                            </div>
                            <div className="text-sm text-purple-600">Status</div>
                          </div>
                        </div>
                      </div>
                    </div>
                  )}
                </div>

                {hasCard && (

                {/* Publish Settings */}
                <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">Publish Settings</h3>
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="font-medium text-gray-900">Make card publicly accessible</div>
                      <div className="text-sm text-gray-600">Your card will be available at /{formData.username}</div>
                    </div>
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input
                        type="checkbox"
                        checked={formData.is_published}
                        onChange={(e) => setFormData({ ...formData, is_published: e.target.checked })}
                        className="sr-only peer"
                      />
                      <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                    </label>
                  </div>
                </div>
              </div>
                
                  <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                    <h3 className="text-lg font-semibold text-gray-900 mb-4">Quick Actions</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <button
                        onClick={() => setActiveTab('basic')}
                        className="flex items-center gap-3 p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
                      >
                        <Edit3 className="w-5 h-5 text-blue-600" />
                        <div className="text-left">
                          <div className="font-medium">Edit Basic Info</div>
                          <div className="text-sm text-gray-600">Update your name, profession, etc.</div>
                        </div>
                      </button>
                      
                      <button
                        onClick={() => setActiveTab('social')}
                        className="flex items-center gap-3 p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
                      >
                        <Globe className="w-5 h-5 text-green-600" />
                        <div className="text-left">
                          <div className="font-medium">Manage Social Links</div>
                          <div className="text-sm text-gray-600">Add or update social media</div>
                        </div>
                      </button>
                    </div>
                  </div>
                )}
              </div>
            )}

            {activeTab === 'basic' && (
              <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                <h2 className="text-2xl font-bold text-gray-900 mb-6">Basic Information</h2>
                <div className="space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Full Name / Business Name *</label>
                      <input
                        type="text"
                        value={formData.title}
                        onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        placeholder="Enter your full name or business name"
                      />
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Username (for live card) *</label>
                      <div className="relative">
                        <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500 text-sm">/{window.location.host}/c/</span>
                        <input
                          type="text"
                          value={formData.username}
                          onChange={(e) => setFormData({ ...formData, username: e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, '') })}
                          className="w-full pl-32 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                          placeholder="username"
                        />
                      </div>
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Company / Business</label>
                    <input
                      type="text"
                      value={formData.company}
                      onChange={(e) => setFormData({ ...formData, company: e.target.value })}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      placeholder="Enter your company or business name"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Tagline / Short Description</label>
                    <textarea
                      value={formData.tagline}
                      onChange={(e) => setFormData({ ...formData, tagline: e.target.value })}
                      rows={3}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      placeholder="Brief description about yourself or your business"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Profession / Category</label>
                    <select
                      value={formData.profession}
                      onChange={(e) => setFormData({ ...formData, profession: e.target.value })}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    >
                      <option value="">Select your profession</option>
                      {PROFESSIONS.map(prof => (
                        <option key={prof} value={prof}>{prof}</option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Profile Photo / Logo</label>
                    <div className="flex items-center gap-4">
                      {formData.avatar_url ? (
                        <img
                          src={formData.avatar_url}
                          alt="Profile"
                          className="w-20 h-20 rounded-full object-cover border-2 border-gray-200"
                        />
                      ) : (
                        <div className="w-20 h-20 rounded-full bg-gray-100 flex items-center justify-center border-2 border-gray-200">
                          <Camera className="w-8 h-8 text-gray-400" />
                        </div>
                      )}
                      <div>
                        <button className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors">
                          Upload Photo
                        </button>
                        <p className="text-xs text-gray-500 mt-1">JPG, PNG up to 5MB</p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {activeTab === 'contact' && (
              <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                <h2 className="text-2xl font-bold text-gray-900 mb-6">Contact Information</h2>
                <div className="space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Mobile Number</label>
                      <input
                        type="tel"
                        value={formData.phone}
                        onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        placeholder="+1 (555) 123-4567"
                      />
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">WhatsApp Number</label>
                      <input
                        type="tel"
                        value={formData.whatsapp}
                        onChange={(e) => setFormData({ ...formData, whatsapp: e.target.value })}
                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        placeholder="+1 (555) 123-4567"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Email Address</label>
                      <input
                        type="email"
                        value={formData.email}
                        onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        placeholder="your@email.com"
                      />
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Website / Portfolio</label>
                      <input
                        type="url"
                        value={formData.website}
                        onChange={(e) => setFormData({ ...formData, website: e.target.value })}
                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        placeholder="https://yourwebsite.com"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Address</label>
                    <textarea
                      value={formData.address}
                      onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                      rows={3}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      placeholder="Your business address"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Google Maps Link</label>
                    <input
                      type="url"
                      value={formData.map_link}
                      onChange={(e) => setFormData({ ...formData, map_link: e.target.value })}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      placeholder="https://maps.google.com/..."
                    />
                  </div>
                </div>
              </div>
            )}

            {activeTab === 'social' && (
              <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                <h2 className="text-2xl font-bold text-gray-900 mb-6">Social Media Links</h2>
                
                {/* Add Social Link */}
                <div className="bg-gray-50 rounded-lg p-4 mb-6">
                  <h3 className="font-medium text-gray-900 mb-4">Add New Social Link</h3>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <select
                      value={newSocialLink.platform}
                      onChange={(e) => setNewSocialLink({ ...newSocialLink, platform: e.target.value })}
                      className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    >
                      {SOCIAL_PLATFORMS.map(platform => (
                        <option key={platform.name} value={platform.name}>{platform.name}</option>
                      ))}
                    </select>
                    <input
                      type="text"
                      value={newSocialLink.username}
                      onChange={(e) => setNewSocialLink({ ...newSocialLink, username: e.target.value })}
                      placeholder="Username (optional)"
                      className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                    <input
                      type="url"
                      value={newSocialLink.url}
                      onChange={(e) => setNewSocialLink({ ...newSocialLink, url: e.target.value })}
                      placeholder={SOCIAL_PLATFORMS.find(p => p.name === newSocialLink.platform)?.placeholder || 'Profile URL'}
                      className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  </div>
                  <button
                    onClick={addSocialLink}
                    disabled={!newSocialLink.url}
                    className="mt-4 px-4 py-2 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                  >
                    Add Social Link
                  </button>
                </div>

                {/* Social Links List */}
                <div className="space-y-3">
                  {socialLinks.map((link, index) => {
                    const platform = SOCIAL_PLATFORMS.find(p => p.name === link.platform);
                    const Icon = platform?.icon || ExternalLink;
                    
                    return (
                      <div key={index} className="flex items-center justify-between p-4 border border-gray-200 rounded-lg">
                        <div className="flex items-center gap-3">
                          <Icon className="w-5 h-5 text-gray-600" />
                          <div>
                            <div className="font-medium">{link.platform}</div>
                            {link.username && (
                              <div className="text-sm text-gray-600">@{link.username}</div>
                            )}
                            <div className="text-sm text-blue-600 truncate max-w-xs">{link.url}</div>
                          </div>
                        </div>
                        <button
                          onClick={() => removeSocialLink(index)}
                          className="text-red-600 hover:text-red-800 transition-colors"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    );
                  })}
                  
                  {socialLinks.length === 0 && (
                    <div className="text-center py-8 text-gray-500">
                      No social links added yet. Add your first social media link above.
                    </div>
                  )}
                </div>
              </div>
            )}

            {activeTab === 'media' && (
              <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                <h2 className="text-2xl font-bold text-gray-900 mb-6">Media & Gallery</h2>
                
                <div className="space-y-8">
                  {/* Image Gallery */}
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900 mb-4">Image Gallery</h3>
                    <div className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center">
                      <Camera className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                      <p className="text-gray-600 mb-4">Upload business photos, products, certificates</p>
                      <button className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors">
                        Upload Images
                      </button>
                    </div>
                  </div>

                  {/* Video Gallery */}
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900 mb-4">Video Gallery</h3>
                    <div className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center">
                      <Video className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                      <p className="text-gray-600 mb-4">Add YouTube, Instagram, or Vimeo video links</p>
                      <input
                        type="url"
                        placeholder="Paste video URL here"
                        className="w-full max-w-md px-4 py-2 border border-gray-300 rounded-lg mb-4"
                      />
                      <button className="px-6 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors">
                        Add Video
                      </button>
                    </div>
                  </div>

                  {/* Document Gallery */}
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900 mb-4">Document Gallery</h3>
                    <div className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center">
                      <FileText className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                      <p className="text-gray-600 mb-4">Upload brochures, PDFs, certificates</p>
                      <button className="px-6 py-3 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors">
                        Upload Documents
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {activeTab === 'reviews' && (
              <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                <h2 className="text-2xl font-bold text-gray-900 mb-6">Customer Reviews</h2>
                
                <div className="text-center py-12">
                  <Star className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                  <h3 className="text-lg font-medium text-gray-900 mb-2">No Reviews Yet</h3>
                  <p className="text-gray-600 mb-6">Customer reviews will appear here when available.</p>
                  <button className="px-6 py-3 bg-yellow-600 text-white rounded-lg hover:bg-yellow-700 transition-colors">
                    Request Reviews
                  </button>
                </div>
              </div>
            )}

            {activeTab === 'settings' && (
              <div className="space-y-6">
                {/* Theme Settings */}
                <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                  <h2 className="text-2xl font-bold text-gray-900 mb-6">Design Settings</h2>
                  
                  <div className="space-y-6">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-3">Theme</label>
                      <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                        {THEME_PRESETS.map((theme) => (
                          <button
                            key={theme.name}
                            onClick={() => setFormData({ ...formData, theme })}
                            className={`p-4 rounded-lg border-2 transition-all ${
                              formData.theme.name === theme.name
                                ? 'border-blue-500 bg-blue-50'
                                : 'border-gray-200 hover:border-gray-300'
                            }`}
                          >
                            <div className="flex items-center gap-2 mb-2">
                              <div
                                className="w-4 h-4 rounded-full"
                                style={{ backgroundColor: theme.primary }}
                              />
                              <div
                                className="w-4 h-4 rounded-full"
                                style={{ backgroundColor: theme.secondary }}
                              />
                            </div>
                            <div className="text-sm font-medium text-gray-900">{theme.name}</div>
                          </button>
                        ))}
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">Card Shape</label>
                        <select
                          value={formData.shape}
                          onChange={(e) => setFormData({ ...formData, shape: e.target.value })}
                          className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        >
                          <option value="rectangle">Rectangle</option>
                          <option value="rounded">Rounded</option>
                          <option value="circle">Circle</option>
                        </select>
                      </div>
                      
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">Layout Style</label>
                        <select
                          value={formData.layout.style}
                          onChange={(e) => setFormData({ 
                            ...formData, 
                            layout: { ...formData.layout, style: e.target.value }
                          })}
                          className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        >
                          <option value="modern">Modern</option>
                          <option value="classic">Classic</option>
                          <option value="minimal">Minimal</option>
                          <option value="creative">Creative</option>
                        </select>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Publish Settings */}
                <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">Publish Settings</h3>
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="font-medium text-gray-900">Make card publicly accessible</div>
                      <div className="text-sm text-gray-600">Your card will be available at /{formData.username}</div>
                    </div>
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input
                        type="checkbox"
                        checked={formData.is_published}
                        onChange={(e) => setFormData({ ...formData, is_published: e.target.checked })}
                        className="sr-only peer"
                      />
                      <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                    </label>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Sidebar - Preview */}
          <div className="lg:sticky lg:top-24 lg:h-fit">
            <CardPreview formData={formData} socialLinks={socialLinks} />
            
            {/* Save Button */}
            <div className="mt-6">
              <button
                onClick={handleSaveCard}
                disabled={saving || !formData.title || !formData.username}
                className="w-full px-6 py-4 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-lg font-medium hover:from-blue-700 hover:to-purple-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 shadow-lg"
              >
                {saving ? (
                  <div className="flex items-center justify-center gap-2">
                    <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    Saving...
                  </div>
                ) : (
                  <div className="flex items-center justify-center gap-2">
                    <Save className="w-5 h-5" />
                    Save Business Card
                  </div>
                )}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};