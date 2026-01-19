"use client";

import { useState } from "react";
import { Save, Upload, Loader2 } from "lucide-react";
import { updatePersonInfo, type getPersonInfo } from "@/app/actions/contact";
import { uploadCV } from "@/app/actions/upload";

type PersonInfo = Awaited<ReturnType<typeof getPersonInfo>>;

export function ContactManager({ initialData }: { initialData: PersonInfo | null }) {
  const [personInfo, setPersonInfo] = useState(initialData);
  const [isEditing, setIsEditing] = useState(!initialData);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    name: initialData?.name || "",
    role: initialData?.role || "",
    location: initialData?.location || "",
    email: initialData?.email || "",
    linkedIn: initialData?.linkedIn || "",
    cvUrl: initialData?.cvUrl || "",
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const result = await updatePersonInfo(formData);
    setPersonInfo(result);
    setIsEditing(false);
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
      
      // Update the form with the new CV URL
      const updatedFormData = { ...formData, cvUrl: result.cvUrl };
      setFormData(updatedFormData);
      
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

  return (
    <div className="border border-border bg-panel rounded-lg p-6">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-lg font-semibold text-foreground">Contact Information</h2>
        {!isEditing && (
          <button
            onClick={() => setIsEditing(true)}
            className="flex items-center gap-2 px-3 py-1.5 text-sm bg-panel2 text-foreground rounded-lg hover:bg-panel"
          >
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
          </div>
          <div>
            <label className="block text-sm font-medium text-foreground mb-2">LinkedIn URL</label>
            <input
              type="url"
              value={formData.linkedIn}
              onChange={(e) => setFormData({ ...formData, linkedIn: e.target.value })}
              className="w-full px-4 py-2 border border-border bg-background text-foreground rounded-lg"
              placeholder="https://www.linkedin.com/in/..."
              required
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-foreground mb-2">CV/Resume PDF</label>
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <label className="flex items-center gap-2 px-4 py-2 border border-border bg-panel text-foreground rounded-lg hover:bg-panel2 cursor-pointer transition-colors">
                  {isUploading ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin" />
                      Uploading...
                    </>
                  ) : (
                    <>
                      <Upload className="h-4 w-4" />
                      Choose File
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
                {formData.cvUrl && (
                  <span className="text-sm text-muted">
                    Current: <code className="px-1 py-0.5 bg-panel rounded">{formData.cvUrl}</code>
                  </span>
                )}
              </div>
              {uploadError && (
                <p className="text-sm text-red-500">{uploadError}</p>
              )}
              <input
                type="url"
                value={formData.cvUrl}
                onChange={(e) => setFormData({ ...formData, cvUrl: e.target.value })}
                className="w-full px-4 py-2 border border-border bg-background text-foreground rounded-lg"
                placeholder="/cv.pdf or https://example.com/cv.pdf"
              />
              <p className="text-xs text-muted">
                Upload a PDF file or enter a URL manually. Max file size: 10MB
              </p>
            </div>
          </div>
          <div className="flex gap-2">
            <button
              type="submit"
              className="flex items-center gap-2 px-4 py-2 bg-accent text-foreground rounded-lg hover:bg-blue-500"
            >
              <Save className="h-4 w-4" />
              Save
            </button>
            {personInfo && (
              <button
                type="button"
                onClick={() => {
                  setIsEditing(false);
                  setFormData({
                    name: personInfo.name,
                    role: personInfo.role,
                    location: personInfo.location,
                    email: personInfo.email,
                    linkedIn: personInfo.linkedIn,
                    cvUrl: personInfo.cvUrl || "",
                  });
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
