import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { ArrowLeft, Send, Users, Hash, Type, Link as LinkIcon, Bold, AlignCenter, Image, X } from 'lucide-react';
import PageTransition from '../components/PageTransition';
import { useAuth } from '../contexts/AuthContext';

interface TextBlock {
  text: string;
  size: 'normal' | 'large' | 'header';
}

interface ImageBlock {
  imageUrl: string;
  altText: string;
}

const SlackMessengerPage: React.FC = () => {
  const { isAdmin } = useAuth();
  const navigate = useNavigate();
  const [messageType, setMessageType] = useState<'channel' | 'dm'>('channel');
  const [channel, setChannel] = useState('');
  const [emails, setEmails] = useState('');
  const [textBlocks, setTextBlocks] = useState<TextBlock[]>([{ text: '', size: 'normal' }]);
  const [includeButton, setIncludeButton] = useState(false);
  const [buttonText, setButtonText] = useState('Open 24Vibes');
  const [buttonUrl, setButtonUrl] = useState('https://24vibes.netlify.app');
  const [buttonDescription, setButtonDescription] = useState('View more details on the 24Vibes platform:');
  const [includeImage, setIncludeImage] = useState(false);
  const [imageBlock, setImageBlock] = useState<ImageBlock>({ imageUrl: '', altText: '' });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  React.useEffect(() => {
    if (!isAdmin) {
      navigate('/');
    }
  }, [isAdmin, navigate]);

  const handleAddBlock = () => {
    setTextBlocks([...textBlocks, { text: '', size: 'normal' }]);
  };

  const handleRemoveBlock = (index: number) => {
    if (textBlocks.length > 1) {
      setTextBlocks(textBlocks.filter((_, i) => i !== index));
    }
  };

  const handleBlockTextChange = (index: number, text: string) => {
    const newBlocks = [...textBlocks];
    newBlocks[index].text = text;
    setTextBlocks(newBlocks);
  };

  const handleBlockSizeChange = (index: number, size: 'normal' | 'large' | 'header') => {
    const newBlocks = [...textBlocks];
    newBlocks[index].size = size;
    setTextBlocks(newBlocks);
  };

  const handleImageUrlChange = (url: string) => {
    setImageBlock(prev => ({ ...prev, imageUrl: url }));
  };

  const handleImageAltTextChange = (altText: string) => {
    setImageBlock(prev => ({ ...prev, altText }));
  };

  const handleRemoveImage = () => {
    setImageBlock({ imageUrl: '', altText: '' });
  };

  const isValidImageUrl = (url: string) => {
    try {
      new URL(url);
      return /\.(jpg|jpeg|png|gif|webp)$/i.test(url);
    } catch {
      return false;
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      setLoading(true);
      setError(null);
      setSuccess(null);

      const payload = {
        type: messageType,
        blocks: textBlocks,
        button: includeButton ? {
          text: buttonText,
          url: buttonUrl,
          description: buttonDescription
        } : undefined,
        image: includeImage && imageBlock.imageUrl ? {
          imageUrl: imageBlock.imageUrl,
          altText: imageBlock.altText || 'Uploaded image'
        } : undefined,
        ...(messageType === 'channel' ? { channel } : { emails: emails.split(',').map(e => e.trim()) })
      };

      const response = await fetch('/.netlify/functions/slack-messenger', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to send message');
      }

      setSuccess('Message sent successfully!');
      setTextBlocks([{ text: '', size: 'normal' }]);
      setIncludeImage(false);
      setImageBlock({ imageUrl: '', altText: '' });
      if (messageType === 'channel') {
        setChannel('');
      } else {
        setEmails('');
      }
    } catch (err: any) {
      setError(err.message || 'Failed to send message');
    } finally {
      setLoading(false);
    }
  };

  return (
    <PageTransition>
      <div className="min-h-screen bg-gray-50 pt-4">
        <div className="max-w-4xl mx-auto px-6 md:px-8 py-6">
          <Link to="/" className="inline-flex items-center text-blue-600 hover:text-blue-800 mb-6">
            <ArrowLeft size={20} className="mr-2" />
            Back to home
          </Link>
          
          <div className="bg-white rounded-lg border border-gray-200 p-6 md:p-8">
            <h2 className="text-2xl font-bold text-gray-800 mb-6">Slack Messenger</h2>
            
            {error && (
              <div className="mb-4 p-3 bg-red-100 text-red-700 rounded-md">
                {error}
              </div>
            )}
            
            {success && (
              <div className="mb-4 p-3 bg-green-100 text-green-700 rounded-md">
                {success}
              </div>
            )}
            
            <form onSubmit={handleSubmit} className="space-y-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Message Type
                </label>
                <div className="flex space-x-4">
                  <button
                    type="button"
                    onClick={() => setMessageType('channel')}
                    className={`flex items-center px-4 py-2 rounded-lg ${
                      messageType === 'channel'
                        ? 'bg-blue-100 text-blue-700'
                        : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                    }`}
                  >
                    <Hash size={18} className="mr-2" />
                    Channel
                  </button>
                  <button
                    type="button"
                    onClick={() => setMessageType('dm')}
                    className={`flex items-center px-4 py-2 rounded-lg ${
                      messageType === 'dm'
                        ? 'bg-blue-100 text-blue-700'
                        : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                    }`}
                  >
                    <Users size={18} className="mr-2" />
                    Direct Messages
                  </button>
                </div>
              </div>

              {messageType === 'channel' ? (
                <div>
                  <label htmlFor="channel" className="block text-sm font-medium text-gray-700 mb-2">
                    Channel Name
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <Hash size={18} className="text-gray-400" />
                    </div>
                    <input
                      type="text"
                      id="channel"
                      value={channel}
                      onChange={(e) => setChannel(e.target.value)}
                      className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      placeholder="general"
                      required
                    />
                  </div>
                </div>
              ) : (
                <div>
                  <label htmlFor="emails" className="block text-sm font-medium text-gray-700 mb-2">
                    Email Addresses
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <Users size={18} className="text-gray-400" />
                    </div>
                    <input
                      type="text"
                      id="emails"
                      value={emails}
                      onChange={(e) => setEmails(e.target.value)}
                      className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      placeholder="email1@24slides.com, email2@24slides.com"
                      required
                    />
                  </div>
                  <p className="mt-2 text-sm text-gray-500">
                    Separate multiple email addresses with commas
                  </p>
                </div>
              )}

              <div className="space-y-4">
                <div className="flex justify-between items-center">
                  <label className="block text-sm font-medium text-gray-700">
                    Message Blocks
                  </label>
                  <button
                    type="button"
                    onClick={handleAddBlock}
                    className="text-blue-600 hover:text-blue-700 text-sm font-medium"
                  >
                    + Add Block
                  </button>
                </div>

                {textBlocks.map((block, index) => (
                  <div key={index} className="space-y-2 p-4 bg-gray-50 rounded-lg">
                    <div className="flex justify-between items-center">
                      <div className="flex items-center space-x-2">
                        <button
                          type="button"
                          onClick={() => handleBlockSizeChange(index, 'normal')}
                          className={`p-2 rounded ${
                            block.size === 'normal'
                              ? 'bg-blue-100 text-blue-700'
                              : 'bg-gray-200 text-gray-700'
                          }`}
                          title="Normal Text"
                        >
                          <Type size={14} />
                        </button>
                        <button
                          type="button"
                          onClick={() => handleBlockSizeChange(index, 'large')}
                          className={`p-2 rounded ${
                            block.size === 'large'
                              ? 'bg-blue-100 text-blue-700'
                              : 'bg-gray-200 text-gray-700'
                          }`}
                          title="Large Text"
                        >
                          <Bold size={14} />
                        </button>
                        <button
                          type="button"
                          onClick={() => handleBlockSizeChange(index, 'header')}
                          className={`p-2 rounded ${
                            block.size === 'header'
                              ? 'bg-blue-100 text-blue-700'
                              : 'bg-gray-200 text-gray-700'
                          }`}
                          title="Header Text"
                        >
                          <AlignCenter size={14} />
                        </button>
                      </div>
                      {textBlocks.length > 1 && (
                        <button
                          type="button"
                          onClick={() => handleRemoveBlock(index)}
                          className="text-red-600 hover:text-red-700 text-sm"
                        >
                          Remove
                        </button>
                      )}
                    </div>
                    <textarea
                      value={block.text}
                      onChange={(e) => handleBlockTextChange(index, e.target.value)}
                      rows={3}
                      className="block w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      placeholder={`Enter ${block.size} text...`}
                      required
                    />
                  </div>
                ))}
              </div>

              <div className="space-y-4">
                <div className="flex items-center">
                  <input
                    type="checkbox"
                    id="includeImage"
                    checked={includeImage}
                    onChange={(e) => setIncludeImage(e.target.checked)}
                    className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                  />
                  <label htmlFor="includeImage" className="ml-2 block text-sm text-gray-700">
                    Include Image
                  </label>
                </div>

                {includeImage && (
                  <div className="space-y-4 pl-6 border-l-2 border-blue-100">
                    <div>
                      <label htmlFor="imageUrl" className="block text-sm font-medium text-gray-700 mb-2">
                        Image URL
                      </label>
                      <div className="relative">
                        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                          <LinkIcon size={18} className="text-gray-400" />
                        </div>
                        <input
                          type="url"
                          id="imageUrl"
                          value={imageBlock.imageUrl}
                          onChange={(e) => handleImageUrlChange(e.target.value)}
                          className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                          placeholder="https://example.com/image.jpg"
                        />
                      </div>
                      <p className="mt-2 text-sm text-gray-500">
                        Enter a direct URL to an image (JPG, PNG, GIF, WebP)
                      </p>
                    </div>

                    <div>
                      <label htmlFor="imageAltText" className="block text-sm font-medium text-gray-700 mb-2">
                        Alt Text (for accessibility)
                      </label>
                      <input
                        type="text"
                        id="imageAltText"
                        value={imageBlock.altText}
                        onChange={(e) => handleImageAltTextChange(e.target.value)}
                        className="block w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                        placeholder="Describe the image..."
                      />
                    </div>

                    {imageBlock.imageUrl && (
                      <div className="space-y-2">
                        <label className="block text-sm font-medium text-gray-700">
                          Image Preview
                        </label>
                        {isValidImageUrl(imageBlock.imageUrl) ? (
                          <div className="relative inline-block">
                            <img
                              src={imageBlock.imageUrl}
                              alt={imageBlock.altText || "Preview"}
                              className="max-w-xs max-h-48 rounded-lg border border-gray-300"
                              onError={(e) => {
                                (e.target as HTMLImageElement).style.display = 'none';
                              }}
                            />
                            <button
                              type="button"
                              onClick={handleRemoveImage}
                              className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-1 hover:bg-red-600"
                            >
                              <X size={16} />
                            </button>
                          </div>
                        ) : (
                          <div className="p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
                            <div className="flex items-center">
                              <Image size={16} className="text-yellow-600 mr-2" />
                              <span className="text-sm text-yellow-700">
                                Invalid image URL. Please enter a direct link to an image file.
                              </span>
                            </div>
                          </div>
                        )}
                      </div>
                    )}

                    {imageBlock.imageUrl && isValidImageUrl(imageBlock.imageUrl) && (
                      <div className="p-3 bg-green-50 border border-green-200 rounded-lg">
                        <div className="flex items-center">
                          <Image size={16} className="text-green-600 mr-2" />
                          <span className="text-sm text-green-700">Image ready to send</span>
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>

              <div className="space-y-4">
                <div className="flex items-center">
                  <input
                    type="checkbox"
                    id="includeButton"
                    checked={includeButton}
                    onChange={(e) => setIncludeButton(e.target.checked)}
                    className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                  />
                  <label htmlFor="includeButton" className="ml-2 block text-sm text-gray-700">
                    Include Button
                  </label>
                </div>

                {includeButton && (
                  <div className="space-y-4 pl-6">
                    <div>
                      <label htmlFor="buttonDescription" className="block text-sm font-medium text-gray-700 mb-2">
                        Button Description
                      </label>
                      <input
                        type="text"
                        id="buttonDescription"
                        value={buttonDescription}
                        onChange={(e) => setButtonDescription(e.target.value)}
                        className="block w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                        placeholder="Text that appears before the button..."
                      />
                    </div>
                    <div>
                      <label htmlFor="buttonText" className="block text-sm font-medium text-gray-700 mb-2">
                        Button Text
                      </label>
                      <input
                        type="text"
                        id="buttonText"
                        value={buttonText}
                        onChange={(e) => setButtonText(e.target.value)}
                        className="block w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                        placeholder="Button text..."
                      />
                    </div>
                    <div>
                      <label htmlFor="buttonUrl" className="block text-sm font-medium text-gray-700 mb-2">
                        Button URL
                      </label>
                      <div className="relative">
                        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                          <LinkIcon size={18} className="text-gray-400" />
                        </div>
                        <input
                          type="url"
                          id="buttonUrl"
                          value={buttonUrl}
                          onChange={(e) => setButtonUrl(e.target.value)}
                          className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                          placeholder="https://..."
                        />
                      </div>
                    </div>
                  </div>
                )}
              </div>

              <div className="flex justify-end">
                <button
                  type="submit"
                  disabled={loading || (includeImage && imageBlock.imageUrl && !isValidImageUrl(imageBlock.imageUrl))}
                  className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50"
                >
                  {loading ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                      Sending...
                    </>
                  ) : (
                    <>
                      <Send size={18} className="mr-2" />
                      Send Message
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>
    </PageTransition>
  );
};

export default SlackMessengerPage;