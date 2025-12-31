import { useState, useEffect, useRef } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Textarea } from '@/components/ui/textarea';
import { ProfileSkeleton } from '@/components/LoadingSkeleton';
import { useToast } from '@/hooks/use-toast';
import { User, Mail, Save, MapPin, Phone, Link as LinkIcon, Upload, X } from 'lucide-react';
import { SEO } from '@/components/SEO';
import { auth } from '@/lib/firebase';
import api, { FIREBASE_CONFIG } from '@/lib/axios';
import { firestoreRest, extractVal } from '@/lib/firestore-rest';
import { ImageCropper } from '@/components/ImageCropper';

interface ProfileData {
  displayName?: string;
  bio: string;
  location: string;
  phone: string;
  website: string;
  photoURL: string;
}

const Profile = () => {
  const { user, refreshUser } = useAuth();
  const { toast } = useToast();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [displayName, setDisplayName] = useState(user?.displayName || '');
  const [profileData, setProfileData] = useState<ProfileData>({
    bio: '',
    location: '',
    phone: '',
    website: '',
    photoURL: user?.photoURL || '',
  });
  const [loading, setLoading] = useState(false);
  const [loadingProfile, setLoadingProfile] = useState(true);
  const [firestoreAvailable, setFirestoreAvailable] = useState<boolean | null>(null);
  const [uploadingImage, setUploadingImage] = useState(false);
  const [imagePreview, setImagePreview] = useState<string | null>(user?.photoURL || null);
  const [cropperOpen, setCropperOpen] = useState(false);
  const [imageToCrop, setImageToCrop] = useState<string | null>(null);
  const profileLoaded = useRef(false);

  useEffect(() => {
    const loadProfile = async () => {
      // Don't reload if already loaded and user hasn't changed
      if (profileLoaded.current || !user) {
        if (!user) setLoadingProfile(false);
        return;
      }

      // If we already detected Firestore is unavailable, skip fetching to avoid long retries.
      if (firestoreAvailable === false) {
        setLoadingProfile(false);
        return;
      }

      try {
        // Use manual Axios REST call for faster loading and to avoid SDK "channel" calls
        const idToken = await user.getIdToken();
        const data = await firestoreRest.get('profiles', user.uid, idToken);

        setFirestoreAvailable(true);

        if (data.fields) {
          const profileData: ProfileData = {
            bio: extractVal(data.fields.bio),
            location: extractVal(data.fields.location),
            phone: extractVal(data.fields.phone),
            website: extractVal(data.fields.website),
            photoURL: extractVal(data.fields.photoURL) || user.photoURL || '',
            displayName: extractVal(data.fields.displayName) || user.displayName || '',
          };

          setProfileData(profileData);

          if (profileData.displayName) {
            setDisplayName(profileData.displayName);
          }
          setImagePreview(profileData.photoURL || null);
        }
        profileLoaded.current = true;
      } catch (error: any) {
        console.error('Error loading profile:', error);

        // If 404, the document doesn't exist yet, which is fine
        if (error.response?.status === 404) {
          setFirestoreAvailable(true);
          setImagePreview(user?.photoURL || null);
          profileLoaded.current = true;
        } else {
          const message = error.response?.data?.error?.message || error.message || '';
          if (message.includes('NOT_FOUND') || message.includes('database')) {
            setFirestoreAvailable(false);
          }
        }
      } finally {
        setLoadingProfile(false);
      }
    };

    loadProfile();
    // Only load profile when user changes
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user]);

  const handleImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !user) return;

    // Validate file type
    if (!file.type.startsWith('image/')) {
      toast({
        title: "Error",
        description: "Please select a valid image file",
        variant: "destructive",
      });
      return;
    }

    // Validate file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      toast({
        title: "Error",
        description: "Image size must be less than 5MB",
        variant: "destructive",
      });
      return;
    }

    // Create object URL for cropping
    const imageUrl = URL.createObjectURL(file);
    setImageToCrop(imageUrl);
    setCropperOpen(true);
  };

  const handleCropComplete = async (croppedBlob: Blob) => {
    if (!user) return;

    setUploadingImage(true);
    try {
      // Cloudinary upload (no CORS issues!)
      const cloudName = import.meta.env.VITE_CLOUDINARY_CLOUD_NAME || 'demo';
      const uploadPreset = import.meta.env.VITE_CLOUDINARY_UPLOAD_PRESET || 'unsigned_preset';

      const formData = new FormData();
      formData.append('file', croppedBlob);
      formData.append('upload_preset', uploadPreset);
      formData.append('folder', 'profile-photos');

      const response = await api.post(
        `https://api.cloudinary.com/v1_1/${cloudName}/image/upload`,
        formData,
        {
          headers: {
            'Content-Type': 'multipart/form-data',
          },
        }
      );

      const downloadURL = response.data.secure_url;

      setProfileData((prev) => ({ ...prev, photoURL: downloadURL }));
      setImagePreview(downloadURL);
      toast({
        title: "Success",
        description: "Image uploaded successfully",
      });
    } catch (error: any) {
      console.error('Upload error:', error);
      toast({
        title: "Error",
        description: error.message || "Failed to upload image. Check your Cloudinary credentials in .env file",
        variant: "destructive",
      });
    } finally {
      setUploadingImage(false);
      // Clean up object URL
      if (imageToCrop) {
        URL.revokeObjectURL(imageToCrop);
        setImageToCrop(null);
      }
    }
  };

  const handleRemoveImage = () => {
    setProfileData((prev) => ({ ...prev, photoURL: '' }));
    setImagePreview(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleUpdateProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;

    setLoading(true);
    try {
      // 1. Get the latest ID Token for authorization
      const idToken = await user.getIdToken(true);

      // 2. Update Firebase Auth profile via Identity Toolkit REST API
      // This makes the payload visible in the network tab as requested
      await api.post(
        `https://identitytoolkit.googleapis.com/v1/accounts:update?key=${FIREBASE_CONFIG.apiKey}`,
        {
          idToken,
          displayName,
          photoUrl: profileData.photoURL,
          returnSecureToken: true,
        }
      );

      // 3. Update Firestore profile via REST API
      if (firestoreAvailable !== false) {
        // Use helper for clean REST PATCH
        await firestoreRest.patch('profiles', user.uid, {
          displayName,
          bio: profileData.bio || '',
          location: profileData.location || '',
          phone: profileData.phone || '',
          website: profileData.website || '',
          photoURL: profileData.photoURL || '',
        }, idToken);

        if (firestoreAvailable === null) {
          setFirestoreAvailable(true);
        }
      }

      // 4. Refresh user in context to update Navbar immediately
      // This assumes `refreshUser` is destructured from `useAuth` at the top of the component.
      // For example: `const { user, refreshUser } = useAuth();`
      if (refreshUser) { // Check if refreshUser is available
        await refreshUser();
      }

      // Show success toast notification
      toast({
        title: '✓ Success',
        description:
          firestoreAvailable === false
            ? 'Account updated. Enable Firestore to save additional details.'
            : 'Profile updated successfully! All data passed through API correctly.',
        variant: 'default',
        duration: 5000,
      });
    } catch (error: any) {
      console.error('Update error:', error);
      const message = error.response?.data?.error?.message || error.message || 'Failed to update profile';

      if (message.includes('NOT_FOUND') || message.includes('database')) {
        setFirestoreAvailable(false);
        toast({
          title: 'Firestore not enabled',
          description: 'Enable Cloud Firestore for this Firebase project to save profile details.',
          variant: 'destructive',
          duration: 5000,
        });
      } else {
        toast({
          title: 'Error',
          description: message,
          variant: 'destructive',
          duration: 5000,
        });
      }
    } finally {
      setLoading(false);
    }
  };

  const initials = user?.displayName
    ?.split(' ')
    .map(n => n[0])
    .join('')
    .toUpperCase() || user?.email?.[0].toUpperCase() || 'U';

  return (
    <>
      <SEO
        title="Profile"
        description="Manage your profile settings and personal information"
        keywords="profile, settings, user account"
      />
      <div className="min-h-screen py-12 md:py-20">
        <div className="container mx-auto px-4 max-w-2xl">
          <div className="text-center mb-8 animate-fade-in">
            <h1 className="text-4xl md:text-5xl font-bold mb-4 bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
              Your Profile
            </h1>
            <p className="text-lg text-muted-foreground">
              Manage your account settings
            </p>
          </div>

          <Card className="p-6 md:p-8 animate-slide-up">
            {loadingProfile ? (
              <ProfileSkeleton />
            ) : (
              <>
                {/* Profile Header */}
                <div className="flex flex-col sm:flex-row items-center gap-6 mb-8 pb-8 border-b">
                  <div className="relative">
                    <Avatar className="h-24 w-24">
                      <AvatarImage src={imagePreview || profileData.photoURL} alt={user?.displayName || 'User'} />
                      <AvatarFallback className="text-3xl gradient-primary text-white">
                        {initials}
                      </AvatarFallback>
                    </Avatar>
                    {(imagePreview || profileData.photoURL) && (
                      <Button
                        type="button"
                        variant="destructive"
                        size="icon"
                        className="absolute -top-2 -right-2 h-8 w-8 rounded-full"
                        onClick={handleRemoveImage}
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    )}
                  </div>
                  <div className="flex-1 text-center sm:text-left">
                    <h2 className="text-2xl font-bold mb-1">{user?.displayName || 'User'}</h2>
                    <p className="text-muted-foreground mb-4">{user?.email}</p>
                    <div className="flex flex-col sm:flex-row gap-2">
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() => fileInputRef.current?.click()}
                        disabled={uploadingImage}
                        className="gap-2"
                      >
                        <Upload className="h-4 w-4" />
                        {uploadingImage ? 'Uploading...' : 'Upload Photo'}
                      </Button>
                      <input
                        ref={fileInputRef}
                        type="file"
                        accept="image/*"
                        onChange={handleImageSelect}
                        className="hidden"
                      />
                    </div>

                    {/* Image Cropper Modal */}
                    {imageToCrop && (
                      <ImageCropper
                        image={imageToCrop}
                        open={cropperOpen}
                        onClose={() => {
                          setCropperOpen(false);
                          if (imageToCrop) {
                            URL.revokeObjectURL(imageToCrop);
                            setImageToCrop(null);
                          }
                        }}
                        onCropComplete={handleCropComplete}
                        aspectRatio={1}
                      />
                    )}
                  </div>
                </div>

                {/* Profile Form */}
                <form onSubmit={handleUpdateProfile} className="space-y-6">
                  <div className="grid gap-6 md:grid-cols-2">
                    <div className="space-y-2">
                      <Label htmlFor="displayName" className="flex items-center gap-2">
                        <User className="w-4 h-4" />
                        Display Name
                      </Label>
                      <Input
                        id="displayName"
                        value={displayName}
                        onChange={(e) => setDisplayName(e.target.value)}
                        placeholder="Enter your display name"
                        className="transition-smooth"
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="email" className="flex items-center gap-2">
                        <Mail className="w-4 h-4" />
                        Email
                      </Label>
                      <Input
                        id="email"
                        value={user?.email || ''}
                        disabled
                        className="bg-muted cursor-not-allowed"
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="phone" className="flex items-center gap-2">
                        <Phone className="w-4 h-4" />
                        Phone
                      </Label>
                      <Input
                        id="phone"
                        value={profileData.phone}
                        onChange={(e) => setProfileData(prev => ({ ...prev, phone: e.target.value }))}
                        placeholder="Enter your phone number"
                        className="transition-smooth"
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="location" className="flex items-center gap-2">
                        <MapPin className="w-4 h-4" />
                        Location
                      </Label>
                      <Input
                        id="location"
                        value={profileData.location}
                        onChange={(e) => setProfileData(prev => ({ ...prev, location: e.target.value }))}
                        placeholder="City, Country"
                        className="transition-smooth"
                      />
                    </div>

                    <div className="space-y-2 md:col-span-2">
                      <Label htmlFor="website" className="flex items-center gap-2">
                        <LinkIcon className="w-4 h-4" />
                        Website
                      </Label>
                      <Input
                        id="website"
                        value={profileData.website}
                        onChange={(e) => setProfileData(prev => ({ ...prev, website: e.target.value }))}
                        placeholder="https://yourwebsite.com"
                        className="transition-smooth"
                      />
                    </div>

                    <div className="space-y-2 md:col-span-2">
                      <Label htmlFor="photoURL" className="flex items-center gap-2">
                        <User className="w-4 h-4" />
                        Profile Picture URL (Optional)
                      </Label>
                      <Input
                        id="photoURL"
                        value={profileData.photoURL}
                        onChange={(e) => setProfileData(prev => ({ ...prev, photoURL: e.target.value }))}
                        placeholder="Or paste an image URL directly"
                        className="transition-smooth"
                      />
                      <p className="text-xs text-muted-foreground">
                        You can upload an image above or paste a URL here
                      </p>
                    </div>

                    <div className="space-y-2 md:col-span-2">
                      <Label htmlFor="bio" className="flex items-center gap-2">
                        <User className="w-4 h-4" />
                        Bio
                      </Label>
                      <Textarea
                        id="bio"
                        value={profileData.bio}
                        onChange={(e) => setProfileData(prev => ({ ...prev, bio: e.target.value }))}
                        placeholder="Tell us about yourself"
                        className="transition-smooth min-h-[100px]"
                      />
                    </div>
                  </div>

                  <Button
                    type="submit"
                    className="w-full gradient-primary"
                    disabled={loading}
                  >
                    <Save className="w-4 h-4 mr-2" />
                    {loading ? 'Saving...' : 'Save Changes'}
                  </Button>
                </form>

                {/* Account Info */}
                <div className="mt-8 pt-8 border-t space-y-4">
                  <h3 className="text-lg font-semibold">Account Information</h3>
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <p className="text-muted-foreground">Account Created</p>
                      <p className="font-medium">
                        {user?.metadata.creationTime
                          ? new Date(user.metadata.creationTime).toLocaleDateString()
                          : 'N/A'}
                      </p>
                    </div>
                    <div>
                      <p className="text-muted-foreground">Last Sign In</p>
                      <p className="font-medium">
                        {user?.metadata.lastSignInTime
                          ? new Date(user.metadata.lastSignInTime).toLocaleDateString()
                          : 'N/A'}
                      </p>
                    </div>
                  </div>
                </div>
              </>
            )}
          </Card>
        </div>
      </div>
    </>
  );
};

export default Profile;