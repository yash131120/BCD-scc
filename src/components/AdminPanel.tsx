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
  Youtube
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
  title: string;
  company: string;
  phone: string;
  email: string;
  website: string;
  avatar_url: string;
  theme: {
    primary: string;
    secondary: string;
    background: string;
    text: string;
  };
  shape: string;
  layout: {
    style: string;
    alignment: string;
    font: string;
  };
  is_published: boolean;
}

const SOCIAL_PLATFORMS = [
  'Instagram',
  'LinkedIn',
  'GitHub',
  'Twitter',
  'Facebook',
  'You Tube',
  'Website'
];

const THEME_PRESETS = [
  { name: 'Ocean Blue', primary: '#3B82F6', secondary: '#1E40AF', background: '#FFFFFF', text: '#1F2937' },
  { name: 'Forest Green', primary: '#10B981', secondary: '#047857', background: '#FFFFFF', text: '#1F2937' },
  { name: 'Sunset Orange', primary: '#F59E0B', secondary: '#D97706', background: '#FFFFFF', text: '#1F2937' },
  { name: 'Royal Purple', primary: '#8B5CF6', secondary: '#7C3AED', background: '#FFFFFF', text: '#1F2937' },
  { name: 'Rose Pink', primary: '#EC4899', secondary: '#DB2777', background: '#FFFFFF', text: '#1F2937' },
  { name: 'Dark Mode', primary: '#60A5FA', secondary: '#3B82F6', background: '#1F2937', text: '#F9FAFB' },
];

const FONT_OPTIONS = ['Inter', 'Roboto', 'Open Sans', 'Lato', 'Montserrat', 'Poppins'];

export const AdminPanel: React.FC = () => {
  const { user, signOut, loading } = useAuth(); // <-- add loading
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<'cards' | 'create' | 'settings'>('cards');
  const [businessCards, setBusinessCards] = useState<BusinessCard[]>([]);
  const [socialLinks, setSocialLinks] = useState<SocialLink[]>([]);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [saving, setSaving] = useState(false);
  const [editingCard, setEditingCard] = useState<BusinessCard | null>(null);

  const [formData, setFormData] = useState<FormData>({
    title: '',
    company: '',
    phone: '',
    email: user?.email || '',
    website: '',
    avatar_url: '',
    theme: THEME_PRESETS[0],
    shape: 'rectangle',
    layout: {
      style: 'modern',
      alignment: 'center',
      font: 'Inter'
    },
    is_published: false
  });

  const [newSocialLink, setNewSocialLink] = useState({
    platform: 'Instagram',
    username: '',
    url: ''
  });

  useEffect(() => {
    loadData();
  }, [user]);

  useEffect(() => {
    if (!loading && !user) {
      navigate('/auth', { replace: true });
    }
  }, [user, loading, navigate]);

  const loadData = async () => {
    if (!user) return;

    try {
      setLoading(true);

      // Load profile
      const { data: profileData } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .single();

      if (profileData) {
        setProfile(profileData);
        setFormData(prev => ({
          ...prev,
          title: profileData.name || '',
          email: profileData.email || user.email || ''
        }));
      }

      // Load business cards
      const { data: cardsData } = await supabase
        .from('business_cards')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (cardsData) {
        setBusinessCards(cardsData);
      }

      // Load social links for the first card (if exists)
      if (cardsData && cardsData.length > 0) {
        const { data: socialData } = await supabase
          .from('social_links')
          .select('*')
          .eq('card_id', cardsData[0].id);

        if (socialData) {
          setSocialLinks(socialData);
        }
      }
    } catch (error) {
      console.error('Error loading data:', error);
    } finally {
      setLoading(false);
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
        phone: formData.phone,
        email: formData.email,
        website: formData.website,
        avatar_url: formData.avatar_url,
        theme: formData.theme,
        shape: formData.shape,
        layout: formData.layout,
        is_published: formData.is_published
      };

      let cardId: string;

      if (editingCard) {
        // Update existing card
        const { data, error } = await supabase
          .from('business_cards')
          .update(cardData)
          .eq('id', editingCard.id)
          .select()
          .single();

        if (error) throw error;
        cardId = editingCard.id;
      } else {
        // Create new card
        const { data, error } = await supabase
          .from('business_cards')
          .insert(cardData)
          .select()
          .single();

        if (error) throw error;
        cardId = data.id;
      }

      // Update social links
      // First, delete existing social links
      await supabase
        .from('social_links')
        .delete()
        .eq('card_id', cardId);

      // Then insert new ones
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

      // Reload data
      await loadData();
      
      // Reset form if creating new card
      if (!editingCard) {
        resetForm();
      }
      
      setActiveTab('cards');
    } catch (error) {
      console.error('Error saving card:', error);
      alert('Failed to save card. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  const handleEditCard = (card: BusinessCard) => {
    setEditingCard(card);
    setFormData({
      title: card.title || '',
      company: card.company || '',
      phone: card.phone || '',
      email: card.email || '',
      website: card.website || '',
      avatar_url: card.avatar_url || '',
      theme: (card.theme as any) || THEME_PRESETS[0],
      shape: card.shape,
      layout: (card.layout as any) || { style: 'modern', alignment: 'center', font: 'Inter' },
      is_published: card.is_published
    });
    
    // Load social links for this card
    loadSocialLinks(card.id);
    setActiveTab('create');
  };

  const loadSocialLinks = async (cardId: string) => {
    const { data } = await supabase
      .from('social_links')
      .select('*')
      .eq('card_id', cardId);
    
    if (data) {
      setSocialLinks(data);
    }
  };

  const handleDeleteCard = async (cardId: string) => {
    if (!confirm('Are you sure you want to delete this card?')) return;

    try {
      const { error } = await supabase
        .from('business_cards')
        .delete()
        .eq('id', cardId);

      if (error) throw error;
      await loadData();
    } catch (error) {
      console.error('Error deleting card:', error);
      alert('Failed to delete card. Please try again.');
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
      created_at: new Date().toISOString()
    };

    setSocialLinks([...socialLinks, link]);
    setNewSocialLink({ platform: 'Instagram', username: '', url: '' });
  };

  const removeSocialLink = (index: number) => {
    setSocialLinks(socialLinks.filter((_, i) => i !== index));
  };

  const resetForm = () => {
    setEditingCard(null);
    setFormData({
      title: profile?.name || '',
      company: '',
      phone: '',
      email: user?.email || '',
      website: '',
      avatar_url: '',
      theme: THEME_PRESETS[0],
      shape: 'rectangle',
      layout: {
        style: 'modern',
        alignment: 'center',
        font: 'Inter'
      },
      is_published: false
    });
    setSocialLinks([]);
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
      <header className="bg-white shadow-sm border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 bg-gradient-to-r from-blue-600 to-purple-600 rounded-lg flex items-center justify-center">
                <CreditCard className="w-5 h-5 text-white" />
              </div>
              <h1 className="text-xl font-bold text-gray-900">Business Card Builder</h1>
            </div>
            
            <div className="flex items-center gap-4">
              <span className="text-sm text-gray-600">Welcome, {profile?.name || user?.email}</span>
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
        <div className="flex space-x-1 bg-gray-100 p-1 rounded-lg mb-8 w-fit">
          <button
            onClick={() => setActiveTab('cards')}
            className={`px-4 py-2 rounded-md text-sm font-medium transition-all ${
              activeTab === 'cards'
                ? 'bg-white text-blue-600 shadow-sm'
                : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            <div className="flex items-center gap-2">
              <CreditCard className="w-4 h-4" />
              My Cards
            </div>
          </button>
          <button
            onClick={() => {
              setActiveTab('create');
              if (activeTab !== 'create') resetForm();
            }}
            className={`px-4 py-2 rounded-md text-sm font-medium transition-all ${
              activeTab === 'create'
                ? 'bg-white text-blue-600 shadow-sm'
                : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            <div className="flex items-center gap-2">
              <Plus className="w-4 h-4" />
              {editingCard ? 'Edit Card' : 'Create Card'}
            </div>
          </button>
          <button
            onClick={() => setActiveTab('settings')}
            className={`px-4 py-2 rounded-md text-sm font-medium transition-all ${
              activeTab === 'settings'
                ? 'bg-white text-blue-600 shadow-sm'
                : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            <div className="flex items-center gap-2">
              <Settings className="w-4 h-4" />
              Settings
            </div>
          </button>
        </div>

        {/* Content */}
        {activeTab === 'cards' && (
          <div>
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-2xl font-bold text-gray-900">My Business Cards</h2>
              <button
                onClick={() => {
                  resetForm();
                  setActiveTab('create');
                }}
                className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 transition-colors"
              >
                <Plus className="w-4 h-4" />
                Create New Card
              </button>
            </div>

            {businessCards.length === 0 ? (
              <div className="text-center py-12">
                <CreditCard className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">No business cards yet</h3>
                <p className="text-gray-600 mb-6">Create your first digital business card to get started.</p>
                <button
                  onClick={() => {
                    resetForm();
                    setActiveTab('create');
                  }}
                  className="inline-flex items-center gap-2 px-6 py-3 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 transition-colors"
                >
                  <Plus className="w-5 h-5" />
                  Create Your First Card
                </button>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {businessCards.map((card) => (
                  <div key={card.id} className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
                    <div className="p-6">
                      <div className="flex justify-between items-start mb-4">
                        <div>
                          <h3 className="font-semibold text-gray-900">{card.title || 'Untitled Card'}</h3>
                          <p className="text-sm text-gray-600">{card.company || 'No company'}</p>
                        </div>
                        <div className={`px-2 py-1 rounded-full text-xs font-medium ${
                          card.is_published 
                            ? 'bg-green-100 text-green-800' 
                            : 'bg-gray-100 text-gray-600'
                        }`}>
                          {card.is_published ? 'Published' : 'Draft'}
                        </div>
                      </div>
                      
                      <div className="flex gap-2">
                        <button
                          onClick={() => handleEditCard(card)}
                          className="flex-1 inline-flex items-center justify-center gap-2 px-3 py-2 text-sm bg-blue-50 text-blue-600 rounded-lg hover:bg-blue-100 transition-colors"
                        >
                          <Edit3 className="w-4 h-4" />
                          Edit
                        </button>
                        {card.is_published && (
                          <button
                            onClick={() => window.open(`/c/${card.id}`, '_blank')}
                            className="flex-1 inline-flex items-center justify-center gap-2 px-3 py-2 text-sm bg-green-50 text-green-600 rounded-lg hover:bg-green-100 transition-colors"
                          >
                            <Eye className="w-4 h-4" />
                            View
                          </button>
                        )}
                        <button
                          onClick={() => handleDeleteCard(card.id)}
                          className="px-3 py-2 text-sm bg-red-50 text-red-600 rounded-lg hover:bg-red-100 transition-colors"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {activeTab === 'create' && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* Form */}
            <div className="space-y-6">
              <div className="flex justify-between items-center">
                <h2 className="text-2xl font-bold text-gray-900">
                  {editingCard ? 'Edit Business Card' : 'Create Business Card'}
                </h2>
                {editingCard && (
                  <button
                    onClick={resetForm}
                    className="text-sm text-gray-600 hover:text-gray-900"
                  >
                    Cancel Edit
                  </button>
                )}
              </div>

              {/* Basic Information */}
              <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Basic Information</h3>
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Full Name</label>
                    <input
                      type="text"
                      value={formData.title}
                      onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      placeholder="Enter your full name"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Company</label>
                    <input
                      type="text"
                      value={formData.company}
                      onChange={(e) => setFormData({ ...formData, company: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      placeholder="Enter your company name"
                    />
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
                      <input
                        type="email"
                        value={formData.email}
                        onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        placeholder="Enter your email"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Phone</label>
                      <input
                        type="tel"
                        value={formData.phone}
                        onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        placeholder="Enter your phone number"
                      />
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Website</label>
                    <input
                      type="url"
                      value={formData.website}
                      onChange={(e) => setFormData({ ...formData, website: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      placeholder="Enter your website URL"
                    />
                  </div>
                </div>
              </div>

              {/* Design Settings */}
              {/* <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Design Settings</h3>
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Theme</label>
                    <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                      {THEME_PRESETS.map((theme) => (
                        <button
                          key={theme.name}
                          onClick={() => setFormData({ ...formData, theme })}
                          className={`p-3 rounded-lg border-2 transition-all ${
                            formData.theme.name === theme.name
                              ? 'border-blue-500 bg-blue-50'
                              : 'border-gray-200 hover:border-gray-300'
                          }`}
                        >
                          <div className="flex items-center gap-2 mb-1">
                            <div
                              className="w-4 h-4 rounded-full"
                              style={{ backgroundColor: theme.primary }}
                            />
                            <div
                              className="w-4 h-4 rounded-full"
                              style={{ backgroundColor: theme.secondary }}
                            />
                          </div>
                          <div className="text-xs font-medium text-gray-900">{theme.name}</div>
                        </button>
                      ))}
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Shape</label>
                      <select
                        value={formData.shape}
                        onChange={(e) => setFormData({ ...formData, shape: e.target.value })}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      >
                        <option value="rectangle">Rectangle</option>
                        <option value="rounded">Rounded</option>
                        <option value="circle">Circle</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Style</label>
                      <select
                        value={formData.layout.style}
                        onChange={(e) => setFormData({ 
                          ...formData, 
                          layout: { ...formData.layout, style: e.target.value }
                        })}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      >
                        <option value="modern">Modern</option>
                        <option value="classic">Classic</option>
                        <option value="minimal">Minimal</option>
                        <option value="creative">Creative</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Font</label>
                      <select
                        value={formData.layout.font}
                        onChange={(e) => setFormData({ 
                          ...formData, 
                          layout: { ...formData.layout, font: e.target.value }
                        })}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      >
                        {FONT_OPTIONS.map(font => (
                          <option key={font} value={font}>{font}</option>
                        ))}
                      </select>
                    </div>
                  </div>
                </div>
              </div> */}

              {/* Social Links */}
              <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Social Links</h3>
                
                {/* Add Social Link */}
                <div className="space-y-3 mb-4">
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                    <select
                      value={newSocialLink.platform}
                      onChange={(e) => setNewSocialLink({ ...newSocialLink, platform: e.target.value })}
                      className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    >
                      {SOCIAL_PLATFORMS.map(platform => (
                        <option key={platform} value={platform}>{platform}</option>
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
                      placeholder="Profile URL"
                      className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  </div>
                  <button
                    onClick={addSocialLink}
                    disabled={!newSocialLink.url}
                    className="w-full px-4 py-2 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                  >
                    Add Social Link
                  </button>
                </div>

                {/* Social Links List */}
                {socialLinks.length > 0 && (
                  <div className="space-y-2">
                    {socialLinks.map((link, index) => (
                      <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                        <div className="flex items-center gap-3">
                          <div className="text-sm font-medium">{link.platform}</div>
                          {link.username && (
                            <div className="text-sm text-gray-600">@{link.username}</div>
                          )}
                          <div className="text-sm text-blue-600 truncate max-w-xs">{link.url}</div>
                        </div>
                        <button
                          onClick={() => removeSocialLink(index)}
                          className="text-red-600 hover:text-red-800 transition-colors"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Publish Settings */}
              <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900">Publish Settings</h3>
                    <p className="text-sm text-gray-600">Make your card publicly accessible</p>
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

              {/* Save Button */}
              <button
                onClick={handleSaveCard}
                disabled={saving || !formData.title}
                className="w-full px-6 py-3 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                {saving ? (
                  <div className="flex items-center justify-center gap-2">
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    {editingCard ? 'Updating...' : 'Creating...'}
                  </div>
                ) : (
                  editingCard ? 'Update Card' : 'Create Card'
                )}
              </button>
            </div>

            {/* Preview */}
            <div className="lg:sticky lg:top-8">
              <CardPreview formData={formData} socialLinks={socialLinks} />
              <div className="mt-6">
                {/* Design Settings */}
              <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Design Settings</h3>
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Theme</label>
                    <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                      {THEME_PRESETS.map((theme) => (
                        <button
                          key={theme.name}
                          onClick={() => setFormData({ ...formData, theme })}
                          className={`p-3 rounded-lg border-2 transition-all ${
                            formData.theme.name === theme.name
                              ? 'border-blue-500 bg-blue-50'
                              : 'border-gray-200 hover:border-gray-300'
                          }`}
                        >
                          <div className="flex items-center gap-2 mb-1">
                            <div
                              className="w-4 h-4 rounded-full"
                              style={{ backgroundColor: theme.primary }}
                            />
                            <div
                              className="w-4 h-4 rounded-full"
                              style={{ backgroundColor: theme.secondary }}
                            />
                          </div>
                          <div className="text-xs font-medium text-gray-900">{theme.name}</div>
                        </button>
                      ))}
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Shape</label>
                      <select
                        value={formData.shape}
                        onChange={(e) => setFormData({ ...formData, shape: e.target.value })}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      >
                        <option value="rectangle">Rectangle</option>
                        <option value="rounded">Rounded</option>
                        <option value="circle">Circle</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Style</label>
                      <select
                        value={formData.layout.style}
                        onChange={(e) => setFormData({ 
                          ...formData, 
                          layout: { ...formData.layout, style: e.target.value }
                        })}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      >
                        <option value="modern">Modern</option>
                        <option value="classic">Classic</option>
                        <option value="minimal">Minimal</option>
                        <option value="creative">Creative</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Font</label>
                      <select
                        value={formData.layout.font}
                        onChange={(e) => setFormData({ 
                          ...formData, 
                          layout: { ...formData.layout, font: e.target.value }
                        })}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      >
                        {FONT_OPTIONS.map(font => (
                          <option key={font} value={font}>{font}</option>
                        ))}
                      </select>
                    </div>
                  </div>
                </div>
              </div>
              </div>
            </div>
            
          </div>
        )}

        {activeTab === 'settings' && (
          <div className="max-w-2xl">
            <h2 className="text-2xl font-bold text-gray-900 mb-6">Account Settings</h2>
            
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Profile Information</h3>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Name</label>
                  <input
                    type="text"
                    value={profile?.name || ''}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="Enter your name"
                    readOnly
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
                  <input
                    type="email"
                    value={profile?.email || ''}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg bg-gray-50"
                    readOnly
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Role</label>
                  <input
                    type="text"
                    value={profile?.role || 'user'}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg bg-gray-50"
                    readOnly
                  />
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};