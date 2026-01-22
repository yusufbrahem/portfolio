"use client";

import { useState } from "react";
import { Save, Upload, Loader2, Plus, Sparkles } from "lucide-react";
import { updatePersonInfo, type getPersonInfo } from "@/app/actions/contact";
import { uploadCV } from "@/app/actions/upload";

type PersonInfo = Awaited<ReturnType<typeof getPersonInfo>>;

type UserDefaults = {
  name: string;
  email: string;
} | null;

export function ContactManager({ 
  initialData, 
  userDefaults,
  isReadOnly = false 
}: { 
  initialData: PersonInfo | null; 
  userDefaults?: UserDefaults;
  isReadOnly?: boolean;
}) {
  const [personInfo, setPersonInfo] = useState(initialData);
  const [isEditing, setIsEditing] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [isCreating, setIsCreating] = useState(false);
  
  // Extract filename from CV URL if it exists
  const getFilenameFromUrl = (url: string | null | undefined): string | null => {
    if (!url) return null;
    const parts = url.split("/");
    return parts[parts.length - 1] || null;
  };
  
  const [uploadedFileName, setUploadedFileName] = useState<string | null>(
    getFilenameFromUrl(initialData?.cvUrl)
  );
  
  // Get smart defaults: use existing data if available and not empty, otherwise use user defaults
  const getSmartDefaults = () => {
    const existingName = initialData?.name?.trim();
    const existingEmail = initialData?.email?.trim();
    return {
      name: existingName || userDefaults?.name || "",
      email: existingEmail || userDefaults?.email || "",
      role: initialData?.role || "",
      location: initialData?.location || "",
      linkedIn: initialData?.linkedIn || "",
      cvUrl: initialData?.cvUrl || "",
    };
  };
  
  const [formData, setFormData] = useState(getSmartDefaults());

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validate LinkedIn URL format
    if (formData.linkedIn && !formData.linkedIn.match(/^https?:\/\/.+/)) {
      setUploadError("LinkedIn URL must start with http:// or https://");
      return;
    }
    
    try {
      const result = await updatePersonInfo(formData);
      setPersonInfo(result);
      setIsEditing(false);
      setIsCreating(false);
      setUploadError(null);
    } catch (error) {
      setUploadError(error instanceof Error ? error.message : "Failed to save contact information");
    }
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsUploading(true);
    setUploadError(null);

    try {
      const uploadFormData = new FormData();
      uploadFormData.append("file", file);

      const result = await uploadCV(uploadFormData);
      
      // Update the form with the new CV URL and filename
      const updatedFormData = { ...formData, cvUrl: result.cvUrl };
      setFormData(updatedFormData);
      setUploadedFileName(result.filename || null);
      
      // Also update personInfo in database
      const updatedPersonInfo = await updatePersonInfo(updatedFormData);
      setPersonInfo(updatedPersonInfo);
    } catch (error) {
      setUploadError(error instanceof Error ? error.message : "Failed to upload CV");
    } finally {
      setIsUploading(false);
      // Reset file input
      e.target.value = "";
    }
  };


  if (!personInfo && !isEditing) {
    return (
      <div className="border border-border bg-panel rounded-lg p-6">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-lg font-semibold text-foreground">Profile</h2>
        </div>
        <p className="text-sm text-muted">No profile yet for this portfolio.</p>
        <button
          onClick={() => {
            setIsCreating(true);
            setIsEditing(true);
            // Pre-fill with smart defaults when creating
            setFormData(getSmartDefaults());
          }}
          disabled={isReadOnly}
          className="mt-4 inline-flex items-center gap-2 px-4 py-2 bg-accent text-foreground font-semibold rounded-lg hover:bg-blue-500 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <Plus className="h-4 w-4" />
          Create profile
        </button>
      </div>
    );
  }

  return (
    <div className="border border-border bg-panel rounded-lg p-6">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-lg font-semibold text-foreground">Contact Information</h2>
        {!isEditing && (
          <button
            onClick={() => {
              setIsCreating(false);
              setIsEditing(true);
              // When editing, if fields are empty, pre-fill with smart defaults
              const current = {
                name: personInfo?.name?.trim() || "",
                email: personInfo?.email?.trim() || "",
                role: personInfo?.role || "",
                location: personInfo?.location || "",
                linkedIn: personInfo?.linkedIn || "",
                cvUrl: personInfo?.cvUrl || "",
              };
              setFormData({
                name: current.name || userDefaults?.name || "",
                email: current.email || userDefaults?.email || "",
                role: current.role || "",
                location: current.location || "",
                linkedIn: current.linkedIn || "",
                cvUrl: current.cvUrl || "",
              });
            }}
            disabled={isReadOnly}
            className="flex items-center gap-2 px-3 py-1.5 text-sm bg-panel2 text-foreground rounded-lg hover:bg-panel disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <Save className="h-4 w-4" />
            Edit
          </button>
        )}
      </div>

      {isEditing ? (
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-foreground mb-2">Name</label>
            <input
              type="text"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              className="w-full px-4 py-2 border border-border bg-background text-foreground rounded-lg"
              required
            />
            {userDefaults && formData.name === userDefaults.name && !initialData?.name?.trim() && (
              <p className="mt-1.5 text-xs text-muted flex items-center gap-1.5 animate-pulse">
                <Sparkles className="h-3 w-3 text-accent" />
                <span>Suggested from your account</span>
              </p>
            )}
          </div>
          <div>
            <label className="block text-sm font-medium text-foreground mb-2">Role</label>
            <input
              type="text"
              value={formData.role}
              onChange={(e) => setFormData({ ...formData, role: e.target.value })}
              className="w-full px-4 py-2 border border-border bg-background text-foreground rounded-lg"
              required
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-foreground mb-2">Location</label>
            <input
              type="text"
              value={formData.location}
              onChange={(e) => setFormData({ ...formData, location: e.target.value })}
              className="w-full px-4 py-2 border border-border bg-background text-foreground rounded-lg"
              required
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-foreground mb-2">Email</label>
            <input
              type="email"
              value={formData.email}
              onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              className="w-full px-4 py-2 border border-border bg-background text-foreground rounded-lg"
              required
            />
            {userDefaults && formData.email === userDefaults.email && !initialData?.email?.trim() && (
              <p className="mt-1.5 text-xs text-muted flex items-center gap-1.5 animate-pulse">
                <Sparkles className="h-3 w-3 text-accent" />
                <span>Suggested from your account</span>
              </p>
            )}
          </div>
          <div>
            <label className="block text-sm font-medium text-foreground mb-2">LinkedIn URL</label>
            <input
              type="url"
              value={formData.linkedIn}
              onChange={(e) => {
                setFormData({ ...formData, linkedIn: e.target.value });
                setUploadError(null); // Clear error when user types
              }}
              className="w-full px-4 py-2 border border-border bg-background text-foreground rounded-lg"
              placeholder="https://www.linkedin.com/in/..."
              required
              pattern="https?://.+"
              title="Please enter a valid URL starting with http:// or https://"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-foreground mb-2">CV/Resume PDF</label>
            <div className="space-y-2">
              {formData.cvUrl && uploadedFileName ? (
                <div className="border border-border bg-panel rounded-lg p-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="p-2 bg-accent/10 rounded-lg">
                        <Upload className="h-5 w-5 text-accent" />
                      </div>
                      <div>
                        <p className="text-sm font-medium text-foreground">{uploadedFileName}</p>
                        <p className="text-xs text-muted">{formData.cvUrl}</p>
                      </div>
                    </div>
                    <label className="flex items-center gap-2 px-3 py-1.5 text-sm border border-border bg-background text-foreground rounded-lg hover:bg-panel2 cursor-pointer transition-colors">
                      {isUploading ? (
                        <>
                          <Loader2 className="h-4 w-4 animate-spin" />
                          Uploading...
                        </>
                      ) : (
                        <>
                          <Upload className="h-4 w-4" />
                          Replace
                        </>
                      )}
                      <input
                        type="file"
                        accept=".pdf,application/pdf"
                        onChange={handleFileUpload}
                        disabled={isUploading}
                        className="hidden"
                      />
                    </label>
                  </div>
                </div>
              ) : (
                <>
                  <label className="flex items-center justify-center gap-2 px-4 py-3 border-2 border-dashed border-border bg-panel text-foreground rounded-lg hover:bg-panel2 cursor-pointer transition-colors">
                    {isUploading ? (
                      <>
                        <Loader2 className="h-5 w-5 animate-spin" />
                        <span>Uploading...</span>
                      </>
                    ) : (
                      <>
                        <Upload className="h-5 w-5" />
                        <span>Click to upload CV/Resume PDF</span>
                      </>
                    )}
                    <input
                      type="file"
                      accept=".pdf,application/pdf"
                      onChange={handleFileUpload}
                      disabled={isUploading}
                      className="hidden"
                    />
                  </label>
                  <p className="text-xs text-muted text-center">
                    Max file size: 10MB • PDF files only
                  </p>
                </>
              )}
              {uploadError && (
                <p className="text-sm text-red-500 bg-red-50 dark:bg-red-900/20 p-2 rounded">{uploadError}</p>
              )}
            </div>
          </div>
          {uploadError && uploadError.includes("LinkedIn") && (
            <p className="text-sm text-red-500 bg-red-50 dark:bg-red-900/20 p-2 rounded">{uploadError}</p>
          )}
          <div className="flex gap-2">
            <button
              type="submit"
              className="flex items-center gap-2 px-4 py-2 bg-accent text-foreground rounded-lg hover:bg-blue-500"
            >
              <Save className="h-4 w-4" />
              Save
            </button>
            {(personInfo || isCreating) && (
              <button
                type="button"
                onClick={() => {
                  setIsEditing(false);
                  setIsCreating(false);
                  setFormData(getSmartDefaults());
                  setUploadedFileName(getFilenameFromUrl(initialData?.cvUrl));
                  setUploadError(null);
                }}
                className="flex items-center gap-2 px-4 py-2 border border-border bg-panel text-foreground rounded-lg hover:bg-panel2"
              >
                Cancel
              </button>
            )}
          </div>
        </form>
      ) : (
        <div className="space-y-3">
          <div>
            <span className="text-sm text-muted">Name:</span>
            <p className="text-foreground font-medium">{personInfo?.name || "Not set"}</p>
          </div>
          <div>
            <span className="text-sm text-muted">Role:</span>
            <p className="text-foreground font-medium">{personInfo?.role || "Not set"}</p>
          </div>
          <div>
            <span className="text-sm text-muted">Location:</span>
            <p className="text-foreground font-medium">{personInfo?.location || "Not set"}</p>
          </div>
          <div>
            <span className="text-sm text-muted">Email:</span>
            <p className="text-foreground font-medium">{personInfo?.email || "Not set"}</p>
          </div>
          <div>
            <span className="text-sm text-muted">LinkedIn:</span>
            <p className="text-foreground font-medium">
              {personInfo?.linkedIn ? (
                <a href={personInfo.linkedIn} target="_blank" rel="noopener noreferrer" className="text-accent hover:underline">
                  {personInfo.linkedIn}
                </a>
              ) : (
                "Not set"
              )}
            </p>
          </div>
          <div>
            <span className="text-sm text-muted">CV/Resume:</span>
            <p className="text-foreground font-medium">
              {personInfo?.cvUrl ? (
                <a href={personInfo.cvUrl} target="_blank" rel="noopener noreferrer" className="text-accent hover:underline">
                  {personInfo.cvUrl}
                </a>
              ) : (
                "Not set"
              )}
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
